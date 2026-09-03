import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDashboard } from "../api/dashboard.api";
import FillStateBadge from "../components/FillStateBadge";

const STAT_LABELS = {
  shiftsThisWeek: "Shifts this week",
  openShiftsThisWeek: "Open shifts this week",
  signupsThisWeek: "Signups this week",
  shiftsClosedThisWeek: "Shifts closed this week",
};

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading dashboard...</p>;

  const { headline, byState, byProgram, weeklyTrend } = data;
  const chartData = weeklyTrend.map((w) => ({ week: w.weekStart.slice(5), signups: w.count }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STAT_LABELS).map(([key, label]) => (
          <div key={key} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-indigo-700">{headline[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By fill state</h3>
          <div className="space-y-2">
            {Object.entries(byState).map(([state, count]) => (
              <div key={state} className="flex items-center justify-between">
                <FillStateBadge status={state} />
                <span className="text-sm font-medium text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By program</h3>
          <div className="space-y-2">
            {byProgram.map((p) => (
              <div key={p.programId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{p.programName}</span>
                <span className="font-medium text-slate-900">{p.count}</span>
              </div>
            ))}
            {byProgram.length === 0 && <p className="text-sm text-slate-400">No shifts yet.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Signups per week (last 8 weeks)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="signups" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}