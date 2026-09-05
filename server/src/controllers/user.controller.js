import User from "../models/User.js";

export const listVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: "volunteer" }).select("name email");
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch volunteers.", error: err.message });
  }
};