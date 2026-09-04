import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlerts, dismissAlert } from "../api/alerts.api";
import { useAuth } from "../hooks/useAuth";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  const load = () => getAlerts().then((res) => setAlerts(res.data.alerts));

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s while this page is open
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = async (shiftId) => {
    await dismissAlert(shiftId);
    load();
  };

  const active = alerts.filter((a) => !a.dismissed);
  const dismissed = alerts.filter((a) => a.dismissed);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Understaffed Alerts</h2>
      <p className="text-sm text-slate-500">Shifts within the next 3 days that still need volunteers.</p>

      {active.length === 0 && <p className="text-sm text-slate-400">No active alerts.</p>}

      <ul className="space-y-2">
        {active.map((a) => (
          <li key={a.shiftId} className="bg-white border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <Link to={`/programs`} className="font-medium text-slate-900">{a.programName}</Link>
              <p className="text-sm text-slate-600">{a.date.slice(0, 10)} at {a.startTime} — {a.status}</p>
            </div>
            {user.role === "coordinator" && (
              <button
                onClick={() => handleDismiss(a.shiftId)}
                className="text-sm border border-amber-300 text-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-100"
              >
                Dismiss
              </button>
            )}
          </li>
        ))}
      </ul>

      {dismissed.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-slate-500 mt-6">Dismissed</h3>
          <ul className="space-y-2 opacity-60">
            {dismissed.map((a) => (
              <li key={a.shiftId} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="font-medium text-slate-900">{a.programName}</p>
                <p className="text-sm text-slate-500">{a.date.slice(0, 10)} at {a.startTime} — {a.status}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}