import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPrograms, createProgram , archiveProgram, restoreProgram} from "../api/program.api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function ProgramsList() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);

  const loadPrograms = async () => {
    const res = await getPrograms(showArchived);
    setPrograms(res.data);
  };
  
  useEffect(() => { loadPrograms(); }, [showArchived]);
  
  const handleArchive = async (id) => { await archiveProgram(id); loadPrograms(); };
  const handleRestore = async (id) => { await restoreProgram(id); loadPrograms(); };

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
      {user.role === "coordinator" && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived programs
        </label>
      )}
      <ul className="space-y-2">
        {programs.map((p) => (
          <li key={p._id} className={`bg-white border rounded-xl overflow-hidden transition ${p.isArchived ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-indigo-300 hover:shadow-md"}`}>
            <div className="flex items-center justify-between p-4">
              <Link to={`/programs/${p._id}`} className="flex-1">
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-500">{p.description}</p>
              </Link>
              {user.role === "coordinator" && (
                p.isArchived
                  ? <button onClick={() => handleRestore(p._id)} className="text-xs text-indigo-600 hover:underline ml-4">Restore</button>
                  : <button onClick={() => handleArchive(p._id)} className="text-xs text-slate-400 hover:text-red-600 ml-4">Archive</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}