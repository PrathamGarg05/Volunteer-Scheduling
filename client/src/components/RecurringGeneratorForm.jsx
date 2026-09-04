import { useState } from "react";
import { generateRecurringShifts } from "../api/recurring.api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function RecurringGeneratorForm({ programId, onGenerated }) {
  const [form, setForm] = useState({
    dayOfWeek: 6, startTime: "09:00", durationMinutes: "", location: "",
    requiredHeadcount: "", rangeStart: "", rangeEnd: "", holidaysText: "",
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setReport(null);
    try {
      const holidays = form.holidaysText
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await generateRecurringShifts(programId, {
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        durationMinutes: Number(form.durationMinutes),
        location: form.location,
        requiredHeadcount: Number(form.requiredHeadcount),
        rangeStart: form.rangeStart,
        rangeEnd: form.rangeEnd,
        holidays,
      });

      setReport(res.data);
      onGenerated();
      setForm({dayOfWeek: 6, startTime: "09:00", durationMinutes: "", location: "",
        requiredHeadcount: "", rangeStart: "", rangeEnd: "", holidaysText: ""}) // tells the parent (ProgramDetail) to refresh its shift list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate shifts.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Generate recurring shifts</h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Day of week</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Start time</label>
          <input
            type="time" value={form.startTime} required
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
          <input
            type="number" min="1" value={form.durationMinutes} required
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <input
            value={form.location} required
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Headcount needed</label>
          <input
            type="number" min="1" value={form.requiredHeadcount} required
            onChange={(e) => setForm({ ...form, requiredHeadcount: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div />
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input
            type="date" value={form.rangeStart} required
            onChange={(e) => setForm({ ...form, rangeStart: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input
            type="date" value={form.rangeEnd} required
            onChange={(e) => setForm({ ...form, rangeEnd: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Holiday dates (comma-separated, YYYY-MM-DD)
          </label>
          <input
            placeholder="2026-09-13, 2026-09-20"
            value={form.holidaysText}
            onChange={(e) => setForm({ ...form, holidaysText: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition"
          >
            Generate Shifts
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {report && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-700 mb-2">
            <span className="font-medium text-green-700">{report.totalCreated} created</span>
            {" · "}
            <span className="font-medium text-amber-700">{report.totalSkipped} skipped</span>
          </p>
          <ul className="text-xs text-slate-500 space-y-1 max-h-40 overflow-y-auto">
            {report.created.map((c) => (
              <li key={c.date}>✓ {c.date} — created</li>
            ))}
            {report.skipped.map((s) => (
              <li key={s.date}>✗ {s.date} — skipped ({s.reason})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}