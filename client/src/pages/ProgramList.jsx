import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPrograms, createProgram } from "../api/program.api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function ProgramsList() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const { user } = useAuth();

  const loadPrograms = async () => {
    const res = await getPrograms();
    setPrograms(res.data);
  };

  useEffect(() => { loadPrograms(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createProgram(form);
    setForm({ name: "", description: "" });
    loadPrograms();
  };

  return (
    <div>
      <h2>Programs</h2>

      {user.role === "coordinator" && (
        <form onSubmit={handleCreate}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit">Create Program</button>
        </form>
      )}

      <ul>
        {programs.map((p) => (
          <li key={p._id}>
            <Link to={`/programs/${p._id}`}>{p.name}</Link> — {p.description}
          </li>
        ))}
      </ul>
    </div>
  );
}