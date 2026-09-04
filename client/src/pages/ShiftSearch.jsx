import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchShifts } from "../api/shiftSearch.api.js";
import { getPrograms } from "../api/program.api.js";
import FillStateBadge from "../components/FillStateBadge";

export default function ShiftSearch() {
  const [filters, setFilters] = useState({
    search: "", program: "", status: "", dateFrom: "", dateTo: "",
    sortBy: "date", sortOrder: "asc", page: 1, limit: 10,
  });
  const [result, setResult] = useState({ shifts: [], total: 0, totalPages: 1 });
  const [programs, setPrograms] = useState([]);

  useEffect(() => { getPrograms().then((res) => setPrograms(res.data)); }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
    searchShifts(params).then((res) => setResult(res.data));
  }, [filters]);

  const update = (key, value) => setFilters({ ...filters, [key]: value, page: 1 }); // reset to page 1 on any filter change

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-slate-900">Search Shifts</h2>

      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          placeholder="Search program or location..." value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
        />
        <select value={filters.program} onChange={(e) => update("program", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All programs</option>
          {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => update("status", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option>Open</option>
          <option>Partially Filled</option>
          <option>Filled</option>
          <option>Closed</option>
        </select>
        <input type="date" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={filters.sortBy} onChange={(e) => update("sortBy", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="date">Sort: Date</option>
          <option value="startTime">Sort: Start time</option>
          <option value="status">Sort: Fill state</option>
        </select>
        <select value={filters.sortOrder} onChange={(e) => update("sortOrder", e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{result.total} shift{result.total !== 1 ? "s" : ""} found</p>

      <ul className="space-y-2">
        {result.shifts.map((s) => (
          <li key={s._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <Link to={`/programs/${s.program}`} className="font-medium text-slate-900 hover:text-indigo-600">
                {s.programInfo?.name}
              </Link>
              <p className="text-sm text-slate-500">{s.date.slice(0, 10)} at {s.startTime} · {s.location}</p>
            </div>
            <FillStateBadge status={s.status} />
          </li>
        ))}
        {result.shifts.length === 0 && <p className="text-sm text-slate-400">No shifts match these filters.</p>}
      </ul>

      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {filters.page} of {result.totalPages}</span>
          <button
            disabled={filters.page >= result.totalPages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}