import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAlerts } from "../api/alerts.api";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => getAlerts().then((res) => setAlertCount(res.data.activeCount));
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/programs" className="font-semibold text-lg text-indigo-700">
          Volunteer Scheduling
        </Link>
        <Link to="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">Dashboard</Link>
        <Link to="/search" className="text-sm text-slate-600 hover:text-indigo-600">Search</Link>
        <Link to="/alerts" className="text-sm text-slate-600 hover:text-indigo-600 relative">
          Alerts
          {alertCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">{user.name} · <span className="text-indigo-600 font-medium">{user.role}</span></span>
        <button onClick={logout} className="text-red-600 hover:underline">Log out</button>
      </div>
    </nav>
  );
}