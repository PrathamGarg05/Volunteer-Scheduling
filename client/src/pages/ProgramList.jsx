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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Programs</h2>
  
      {user.role === "coordinator" && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Create a program</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            </div>
            <button
            type="submit"
            className="mt-4 w-full sm:w-auto bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition"
            >
            Create Program
            </button>
        </form>
       )}
  
      <ul className="space-y-2">
        {programs.map((p) => (
          <li key={p._id} className="bg-white border rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition">
            <Link to={`/programs/${p._id}`} className="font-medium text-gray-900">{p.name}</Link>
            <p className="text-sm text-gray-500">{p.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}