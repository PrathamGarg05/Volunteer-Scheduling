import Program from '../models/Program.js';
import ProgramMember from '../models/ProgramMember.js';

export const createProgram = async (req, res) => {
    try{
        const {name, description} = req.body;
        if(!name) {
            return res.status(400).json({message: "Name is required."});
        }

        const program = await Program.create({
            name, 
            description: description || "",
            createdBy: req.user.id,
        });

        res.status(201).json(program);
    } catch(err){
        res.status(500).json({message: "Failed to create program.", error: err.message});
    }
};

export const getPrograms = async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === "true";
  
      if (req.user.role === "coordinator") {
        const filter = includeArchived ? {} : { isArchived: false };
        const programs = await Program.find(filter).sort({ createdAt: -1 });
        return res.json(programs);
      }
  
      // volunteer: find their memberships, then the programs those point to
      const memberships = await ProgramMember.find({ volunteer: req.user.id }).select("program");
      const programIds = memberships.map((m) => m.program);
  
      const filter = { _id: { $in: programIds } };
      if (!includeArchived) filter.isArchived = false;
  
      const programs = await Program.find(filter).sort({ createdAt: -1 });
      res.json(programs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch programs.", error: err.message });
    }
};

export const getProgramById = async (req, res) => {
    try {
      const program = await Program.findById(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }
  
      if (req.user.role === "volunteer") {
        const membership = await ProgramMember.findOne({
          program: program._id,
          volunteer: req.user.id,
        });
        if (!membership) {
          return res.status(403).json({ message: "You are not a member of this program." });
        }
      }
  
      res.json(program);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch program.", error: err.message });
    }
};

export const updateProgram = async (req, res) => {
    try {
      const { name, description } = req.body;
      const program = await Program.findById(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }
  
      if (name !== undefined) program.name = name;
      if (description !== undefined) program.description = description;
      await program.save();
  
      res.json(program);
    } catch (err) {
      res.status(500).json({ message: "Failed to update program.", error: err.message });
    }
};

export const archiveProgram = async (req, res) => {
    try {
      const program = await Program.findByIdAndUpdate(
        req.params.id,
        { isArchived: true },
        { new: true }
      );
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }
      res.json(program);
    } catch (err) {
      res.status(500).json({ message: "Failed to archive program.", error: err.message });
    }
};

export const restoreProgram = async (req, res) => {
    try {
      const program = await Program.findByIdAndUpdate(
        req.params.id,
        { isArchived: false },
        { new: true }
      );
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }
      res.json(program);
    } catch (err) {
      res.status(500).json({ message: "Failed to restore program.", error: err.message });
    }
};


  