import ProgramMember from "../models/ProgramMember.js";
import Program from "../models/Program.js";
import User from "../models/User.js";

export const addMember = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const { id: programId } = req.params;

        if (!volunteerId) {
            return res.status(400).json({ message: "volunteerId is required." });
        }
      
        const program = await Program.findById(programId);
        if (!program) {
        return res.status(404).json({ message: "Program not found." });
        }
    
        const volunteer = await User.findById(volunteerId);
        if (!volunteer || volunteer.role !== "volunteer") {
        return res.status(400).json({ message: "volunteerId must refer to a valid volunteer account." });
        }
    
        const existing = await ProgramMember.findOne({ program: programId, volunteer: volunteerId });
        if (existing) {
        return res.status(409).json({ message: "This volunteer is already a member of this program." });
        }
    
        const membership = await ProgramMember.create({ program: programId, volunteer: volunteerId });
        res.status(201).json(membership);
    } catch (err) {
        res.status(500).json({ message: "Failed to add member.", error: err.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { id: programId, volunteerId } = req.params;

        const membership = await ProgramMember.findOneAndDelete({
        program: programId,
        volunteer: volunteerId,
        });

        if (!membership) {
        return res.status(404).json({ message: "This volunteer is not a member of this program." });
        }

        res.json({ message: "Volunteer removed from program." });
    } catch (err) {
        res.status(500).json({ message: "Failed to remove member.", error: err.message });
    }
};

// List a program's members — coordinator-facing, e.g. for the "Add Volunteer" screen
// to show who's already in vs. an "add new" search over remaining volunteers.
export const getProgramMembers = async (req, res) => {
    try {
      const { id: programId } = req.params;
  
      const members = await ProgramMember.find({ program: programId })
        .populate("volunteer", "name email"); // pulls name+email from User, not just the id
  
      res.json(members);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch members.", error: err.message });
    }
};