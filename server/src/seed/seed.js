import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {connectDB } from "../config/db.js";
import User from "../models/User.js";
import Program from "../models/Program.js";
import ProgramMember from "../models/ProgramMember.js";
import Shift from "../models/Shift.js";
import Signup from "../models/Signup.js";
import ShiftEvent from "../models/ShiftEvent.js";
import AlertDismissal from "../models/AlertDismissal.js";
import { deriveFillState } from "../services/fillState.service.js";

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = "Demo1234!";

function daysFromNow(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

// Backdates a document's createdAt after creation — needed because Signup's
// timestamps are auto-set to "now" otherwise, and the 8-week chart needs
// signups spread across real past weeks, not all bunched on seed day.
async function backdate(Model, id, date) {
    await Model.collection.updateOne({ _id: id }, { $set: { createdAt: date } });
  }

async function seed() {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}), Program.deleteMany({}), ProgramMember.deleteMany({}),
    Shift.deleteMany({}), Signup.deleteMany({}), ShiftEvent.deleteMany({}), AlertDismissal.deleteMany({}),
  ]);

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const coordinator = await User.create({ name: "Alice Coordinator", email: "alice@demo.com", passwordHash, role: "coordinator" });
  const [bob, carol, dave, emma] = await Promise.all([
    User.create({ name: "Bob Volunteer", email: "bob@demo.com", passwordHash, role: "volunteer" }),
    User.create({ name: "Carol Volunteer", email: "carol@demo.com", passwordHash, role: "volunteer" }),
    User.create({ name: "Dave Volunteer", email: "dave@demo.com", passwordHash, role: "volunteer" }),
    User.create({ name: "Emma Volunteer", email: "emma@demo.com", passwordHash, role: "volunteer" }),
  ]);

  console.log("Creating programs...");
  const foodPantry = await Program.create({ name: "Food Pantry", description: "Weekly food distribution for the community", createdBy: coordinator._id });
  const trailCleanup = await Program.create({ name: "Trail Cleanup", description: "Monthly park and trail maintenance", createdBy: coordinator._id });
  const tutoringDrive = await Program.create({ name: "Tutoring Drive", description: "After-school tutoring for local students", createdBy: coordinator._id });
  const bloodDrive = await Program.create({ name: "Blood Drive", description: "Quarterly community blood donation events", createdBy: coordinator._id });
  console.log("Adding program members...");
  await ProgramMember.create([
    { program: foodPantry._id, volunteer: bob._id },
    { program: foodPantry._id, volunteer: carol._id },
    { program: foodPantry._id, volunteer: dave._id },
    { program: foodPantry._id, volunteer: emma._id },
    { program: trailCleanup._id, volunteer: bob._id },
    { program: trailCleanup._id, volunteer: carol._id },
    { program: tutoringDrive._id, volunteer: carol._id },
    { program: tutoringDrive._id, volunteer: dave._id },
    { program: bloodDrive._id, volunteer: dave._id },
    { program: bloodDrive._id, volunteer: emma._id },
  ]);

  const volunteers = [bob, carol, dave, emma];
  const volunteerIds = volunteers.map((v) => v._id);

  // Creates a shift with a given number of active signups (deriving the correct
  // fill state), optional cancelled signups, and full event history — so the
  // timeline is never empty for seeded data.
  async function makeShift({ program, date, startTime, durationMinutes, location, requiredHeadcount, members, activeSignupCount, cancelledCount = 0, forceClosed = false, signupCreatedAt }) {
    const shift = await Shift.create({ program, date, startTime, durationMinutes, location, requiredHeadcount, status: "Open" });
    await ShiftEvent.create({ shift: shift._id, type: "created", actor: coordinator._id });
    if (signupCreatedAt) await backdate(ShiftEvent, (await ShiftEvent.findOne({ shift: shift._id, type: "created" }))._id, signupCreatedAt);

    const pool = [...members];
    let currentActive = 0;

    for (let i = 0; i < activeSignupCount && pool.length; i++) {
      const volunteer = pool.shift();
      const signup = await Signup.create({ shift: shift._id, volunteer, createdBy: volunteer, status: "active" });
      if (signupCreatedAt) await backdate(Signup, signup._id, signupCreatedAt);
      const event = await ShiftEvent.create({ shift: shift._id, type: "signup", actor: volunteer, message: `Signed up volunteer ${volunteer}` });
      if (signupCreatedAt) await backdate(ShiftEvent, event._id, signupCreatedAt);
      currentActive++;
    }

    for (let i = 0; i < cancelledCount && pool.length; i++) {
      const volunteer = pool.shift();
      const signup = await Signup.create({ shift: shift._id, volunteer, createdBy: volunteer, status: "cancelled", cancelledAt: new Date() });
      if (signupCreatedAt) await backdate(Signup, signup._id, signupCreatedAt);
      await ShiftEvent.create({ shift: shift._id, type: "cancel", actor: volunteer, message: `Cancelled signup for volunteer ${volunteer}` });
    }

    let status = deriveFillState(currentActive, requiredHeadcount);
    if (forceClosed) status = "Closed";

    if (status !== "Open") {
      shift.status = status;
      await shift.save();
      await ShiftEvent.create({ shift: shift._id, type: "state_change", oldState: "Open", newState: status, actor: coordinator._id });
    }

    return shift;
  }

  console.log("Creating Food Pantry shifts (past 8 weeks + upcoming)...");
  // 8 past weekly shifts, one per week, feeding the dashboard's signup trend chart
  const weeksAgo = [7, 6, 5, 4, 3, 2, 1, 0];
  for (const w of weeksAgo) {
    const shiftDate = daysFromNow(-7 * w - 2); // slightly offset from the exact week boundary
    const signupDate = daysFromNow(-7 * w - 3);
    await makeShift({
      program: foodPantry._id, date: shiftDate, startTime: "09:00", durationMinutes: 240,
      location: "Community Center", requiredHeadcount: 2, members: [...volunteerIds],
      activeSignupCount: w === 0 ? 1 : 2, cancelledCount: w === 3 ? 1 : 0,
      forceClosed: true, signupCreatedAt: signupDate,
    });
  }

  // Upcoming shifts within the 3-day alert window — one Open, one Partially Filled
  await makeShift({
    program: foodPantry._id, date: daysFromNow(1), startTime: "10:00", durationMinutes: 180,
    location: "Community Center", requiredHeadcount: 3, members: [...volunteerIds], activeSignupCount: 0,
  });
  const understaffedShift = await makeShift({
    program: foodPantry._id, date: daysFromNow(2), startTime: "14:00", durationMinutes: 180,
    location: "Community Center", requiredHeadcount: 3, members: [...volunteerIds], activeSignupCount: 1,
  });

  // One further-out Filled shift, for variety
  await makeShift({
    program: foodPantry._id, date: daysFromNow(10), startTime: "09:00", durationMinutes: 240,
    location: "Community Center", requiredHeadcount: 2, members: [...volunteerIds], activeSignupCount: 2,
  });

  console.log("Creating Trail Cleanup shifts...");
  await makeShift({ program: trailCleanup._id, date: daysFromNow(-14), startTime: "08:00", durationMinutes: 180, location: "Riverside Trail", requiredHeadcount: 4, members: [bob._id, carol._id], activeSignupCount: 2, forceClosed: true, signupCreatedAt: daysFromNow(-15) });
  await makeShift({ program: trailCleanup._id, date: daysFromNow(5), startTime: "08:00", durationMinutes: 180, location: "Riverside Trail", requiredHeadcount: 4, members: [bob._id, carol._id], activeSignupCount: 1 });
  await makeShift({ program: trailCleanup._id, date: daysFromNow(12), startTime: "08:00", durationMinutes: 180, location: "Riverside Trail", requiredHeadcount: 2, members: [bob._id, carol._id], activeSignupCount: 2 });

  console.log("Creating Tutoring Drive shifts...");
  await makeShift({ program: tutoringDrive._id, date: daysFromNow(-7), startTime: "16:00", durationMinutes: 90, location: "Main Library", requiredHeadcount: 2, members: [carol._id, dave._id], activeSignupCount: 2, forceClosed: true, signupCreatedAt: daysFromNow(-8) });
  await makeShift({ program: tutoringDrive._id, date: daysFromNow(3), startTime: "16:00", durationMinutes: 90, location: "Main Library", requiredHeadcount: 2, members: [carol._id, dave._id], activeSignupCount: 0 });
  await makeShift({ program: tutoringDrive._id, date: daysFromNow(9), startTime: "16:00", durationMinutes: 90, location: "Main Library", requiredHeadcount: 3, members: [carol._id, dave._id], activeSignupCount: 1 });

  console.log("Creating Blood Drive shifts...");
  await makeShift({ program: bloodDrive._id, date: daysFromNow(-3), startTime: "10:00", durationMinutes: 300, location: "City Hall", requiredHeadcount: 3, members: [dave._id, emma._id], activeSignupCount: 2, forceClosed: true, signupCreatedAt: daysFromNow(-4) });
  await makeShift({ program: bloodDrive._id, date: daysFromNow(15), startTime: "10:00", durationMinutes: 300, location: "City Hall", requiredHeadcount: 2, members: [dave._id, emma._id], activeSignupCount: 2 });

  // A dismissed alert example — dismiss the understaffed shift created above,
  // so the Alerts page's "Dismissed" section has something to show.
  console.log("Creating one dismissed alert example...");
  const dismissedEvent = await ShiftEvent.findOne({ shift: understaffedShift._id, type: "created" });
  await AlertDismissal.create({
    shift: understaffedShift._id,
    stateEnteredAt: dismissedEvent.createdAt, // matches the shift's still-Open initial state
    dismissedBy: coordinator._id,
  });

  console.log("\nSeed complete.");
  console.log("Demo password for all accounts:", DEMO_PASSWORD);
  console.log("Coordinator: alice@demo.com");
  console.log("Volunteers: bob@demo.com, carol@demo.com, dave@demo.com, emma@demo.com");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});