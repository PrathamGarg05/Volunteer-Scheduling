import { useEffect, useState } from "react";
import { getShiftTimeline, addShiftNote } from "../api/shiftEvents.api";
import { useAuth } from "../hooks/useAuth";

const EVENT_LABELS = {
  created: "Shift created",
  state_change: "State changed",
  signup: "Signup",
  cancel: "Cancellation",
  note: "Note",
};

export default function ShiftTimeline({ programId, shiftId, onClose }) {
  const [events, setEvents] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = async () => {
    const res = await getShiftTimeline(programId, shiftId);
    setEvents(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [shiftId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await addShiftNote(programId, shiftId, note);
    setNote("");
    load();
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timeline</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {events.map((e) => (
            <li key={e._id} className="text-sm flex gap-2">
              <span className="text-slate-400 shrink-0">
                {new Date(e.createdAt).toLocaleString()}
              </span>
              <span className="text-slate-700">
                <span className="font-medium">{EVENT_LABELS[e.type]}</span>
                {e.type === "state_change" && ` — ${e.oldState} → ${e.newState}`}
                {e.message && ` — ${e.message}`}
                {e.actor && <span className="text-slate-400"> ({e.actor.name})</span>}
              </span>
            </li>
          ))}
          {events.length === 0 && <p className="text-sm text-slate-400">No history yet.</p>}
        </ul>
      )}

      {user.role === "coordinator" && (
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="text-sm bg-slate-800 text-white rounded-lg px-3 py-1.5 hover:bg-slate-900">
            Add
          </button>
        </form>
      )}
    </div>
  );
}