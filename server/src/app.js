import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import programRoutes from "./routes/program.routes.js";
import programMemberRoutes from "./routes/programMember.routes.js"
import shiftRoutes from "./routes/shift.routes.js";
import signupRoutes from "./routes/signup.routes.js";
import shiftEventRoutes from "./routes/shiftEvent.routes.js";
import shiftSearchRoutes from "./routes/shiftSearch.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import userRoutes from "./routes/user.routes.js";

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
app.use("/api/programs/:id/shifts/:shiftId/signups", signupRoutes);
app.use("/api/programs/:id/shifts/:shiftId/events", shiftEventRoutes);
app.use("/api/shifts", shiftSearchRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/users", userRoutes);

export default app;