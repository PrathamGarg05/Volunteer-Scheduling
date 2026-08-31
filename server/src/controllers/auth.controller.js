import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
  
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required." });
      }
      if (!["coordinator", "volunteer"].includes(role)) {
        return res.status(400).json({ message: "Role must be coordinator or volunteer." });
      }
  
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
  
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ name, email, passwordHash, role });
  
      const token = signToken(user);
      res.status(201).json({ token, user: toSafeUser(user) });
    } catch (err) {
      res.status(500).json({ message: "Registration failed.", error: err.message });
    }
};

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
  
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      const token = signToken(user);
      res.json({ token, user: toSafeUser(user) });
    } catch (err) {
      res.status(500).json({ message: "Login failed.", error: err.message });
    }
};

function signToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
  
function toSafeUser(user) {
    return { id: user._id, name: user.name, email: user.email, role: user.role };
}