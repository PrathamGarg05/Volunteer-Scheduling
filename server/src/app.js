import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import programRoutes from "./routes/program.routes.js";
import programMemberRoutes from "./routes/programMember.routes.js"
import shiftRoutes from "./routes/shift.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is running" });
});

app.use('/api/auth', authRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/programs/:id/members", programMemberRoutes);
app.use("/api/programs/:id/shifts", shiftRoutes);

export default app;