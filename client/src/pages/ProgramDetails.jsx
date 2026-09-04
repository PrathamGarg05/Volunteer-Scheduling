import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProgramById } from "../api/program.api.js";
import { getShiftsByProgram, createShift } from "../api/shifts.api.js";
import { signUpForShift, cancelSignup, getMySignups } from "../api/signups.api.js";
import { useAuth } from "../hooks/useAuth.js";
import FillStateBadge from "../components/FillStateBadge.jsx";
import ShiftTimeline from "../components/ShiftTimeline.jsx";
import RecurringGeneratorForm from "../components/RecurringGeneratorForm.jsx";
import RosterExportButton from "../components/RosterExportButton.jsx";

export default function ProgramDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [mySignups, setMySignups] = useState({});
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState({ date: "", startTime: "", durationMinutes: "", location: "", requiredHeadcount: "" });
  const [expandedShiftId, setExpandedShiftId] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    const [progRes, shiftsRes] = await Promise.all([getProgramById(id), getShiftsByProgram(id)]);
    setProgram(progRes.data);
    setShifts(shiftsRes.data);

    if(user.role === "volunteer") {
      const signupsRes = await getMySignups(id);
      const map = {};
      signupsRes.data.forEach((s) => { map[s.shiftId] = s.signupId; });
      setMySignups(map);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    await createShift(id, form);
    setForm({ date: "", startTime: "", durationMinutes: "", location: "", requiredHeadcount: "" });
    load();
  };

  const handleSignUp = async (shiftId) => {
    setActionError("");
    try {
      const res = await signUpForShift(id, shiftId);
      setMySignups({ ...mySignups, [shiftId]: res.data._id });
      load(); // refresh shift list so the fill-state badge updates
    } catch (err) {
      setActionError(err.response?.data?.message || "Signup failed.");
    }
  };

  const handleCancel = async (shiftId) => {
    setActionError("");
    try {
      await cancelSignup(id, shiftId, mySignups[shiftId]);
      const updated = { ...mySignups };
      delete updated[shiftId];
      setMySignups(updated);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Cancel failed.");
    }
  };

  if (!program) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">{program.name}</h2>
      <p>{program.description}</p>

      {user.role === "coordinator" && (
        <>
          <RecurringGeneratorForm programId={id} onGenerated={load} />
          <div className="flex justify-end">
            <RosterExportButton programId={id} programName={program.name} />
          </div>
          <form onSubmit={handleCreateShift} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Add a shift</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                  type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start time</label>
                  <input
                  type="time" value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
                  <input
                  type="number" min="1" value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                  <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Headcount needed</label>
                  <input
                  type="number" min="1" value={form.requiredHeadcount}
                  onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })} required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
              </div>
              <button
              type="submit"
              className="mt-4 w-full sm:w-auto bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition"
              >
              Add Shift
              </button>
          </form>
        </>
        
       )}

      <h3 className="text-lg font-semibold text-gray-900">Shifts</h3>
      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{actionError}</p>
      )}

      <ul className="space-y-2">
        {shifts.map((s) => {
          const mySignupId = mySignups[s._id];
          const canSignUp =
            user.role === "volunteer" &&
            !mySignupId &&
            (s.status === "Open" || s.status === "Partially Filled");

          return (
            <li
              key={s._id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition"
            >
              {/* Main shift row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    {s.date.slice(0, 10)} at {s.startTime}
                  </p>

                  <p className="text-sm text-slate-500">
                    {s.location} · {s.requiredHeadcount} needed
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <FillStateBadge status={s.status} />

                  {user.role === "volunteer" &&
                    mySignupId &&
                    s.status !== "Closed" && (
                      <button
                        onClick={() => handleCancel(s._id)}
                        className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
                      >
                        Cancel
                      </button>
                    )}

                  {canSignUp && (
                    <button
                      onClick={() => handleSignUp(s._id)}
                      className="text-sm bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 transition"
                    >
                      Sign Up
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline toggle */}
              <button
                onClick={() =>
                  setExpandedShiftId(
                    expandedShiftId === s._id ? null : s._id
                  )
                }
                className="text-xs text-slate-400 hover:text-indigo-600 mt-2"
              >
                {expandedShiftId === s._id
                  ? "Hide timeline"
                  : "View timeline"}
              </button>

              {/* Timeline */}
              {expandedShiftId === s._id && (
                <ShiftTimeline
                  programId={id}
                  shiftId={s._id}
                  onClose={() => setExpandedShiftId(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}