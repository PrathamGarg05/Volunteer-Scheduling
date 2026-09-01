import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProgramById } from "../api/program.api.js";
import { getShiftsByProgram, createShift } from "../api/shifts.api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function ProgramDetail() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState({ date: "", startTime: "", durationMinutes: "", location: "", requiredHeadcount: "" });
  const { user } = useAuth();

  const load = async () => {
    const [progRes, shiftsRes] = await Promise.all([getProgramById(id), getShiftsByProgram(id)]);
    setProgram(progRes.data);
    setShifts(shiftsRes.data);
  };

  useEffect(() => { load(); }, [id]);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    await createShift(id, form);
    setForm({ date: "", startTime: "", durationMinutes: "", location: "", requiredHeadcount: "" });
    load();
  };

  if (!program) return <p>Loading...</p>;

  return (
    <div>
      <h2>{program.name}</h2>
      <p>{program.description}</p>

      {user.role === "coordinator" && (
        <form onSubmit={handleCreateShift}>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          <input type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          <input type="number" placeholder="Headcount needed" value={form.requiredHeadcount} onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })} required />
          <button type="submit">Add Shift</button>
        </form>
      )}

      <h3>Shifts</h3>
      <ul>
        {shifts.map((s) => (
          <li key={s._id}>
            {s.date.slice(0, 10)} at {s.startTime} — {s.location} — {s.status} ({s.requiredHeadcount} needed)
          </li>
        ))}
      </ul>
    </div>
  );
}