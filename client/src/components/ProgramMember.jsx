import { useEffect, useState } from "react";
import { getProgramMembers, addMember, removeMember } from "../api/members.api.js";
import { listVolunteers } from "../api/users.api.js";

export default function ProgramMembers({ programId }) {
  const [members, setMembers] = useState([]);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [membersRes, volunteersRes] = await Promise.all([
      getProgramMembers(programId),
      listVolunteers(),
    ]);
    setMembers(membersRes.data);
    setAllVolunteers(volunteersRes.data);
  };

  useEffect(() => { load(); }, [programId]);

  // volunteers not already members — so the dropdown doesn't offer duplicates
  const memberIds = new Set(members.map((m) => m.volunteer._id));
  const available = allVolunteers.filter((v) => !memberIds.has(v._id));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setError("");
    try {
      await addMember(programId, selectedId);
      setSelectedId("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add volunteer.");
    }
  };

  const handleRemove = async (volunteerId) => {
    await removeMember(programId, volunteerId);
    load();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Members</h3>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <select
          value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select a volunteer to add...</option>
          {available.map((v) => (
            <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
          ))}
        </select>
        <button
          type="submit" disabled={!selectedId}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
        >
          Add
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m._id} className="flex items-center justify-between text-sm border-t border-slate-100 pt-2">
            <span className="text-slate-700">{m.volunteer.name} <span className="text-slate-400">({m.volunteer.email})</span></span>
            <button onClick={() => handleRemove(m.volunteer._id)} className="text-xs text-red-500 hover:underline">
              Remove
            </button>
          </li>
        ))}
        {members.length === 0 && <p className="text-sm text-slate-400">No members yet.</p>}
      </ul>
    </div>
  );
}