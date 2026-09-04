import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function NavBar() {
    const { user, logout } = useAuth();
    if (!user) return null;
  
    return (
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <Link to="/programs" className="font-semibold text-lg text-indigo-700">
                Volunteer Scheduling
            </Link>
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
                Dashboard
            </Link>
            <Link to="/search" className="text-sm text-slate-600 hover:text-indigo-600">Search</Link>
            <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">{user.name} · <span className="text-indigo-600 font-medium">{user.role}</span></span>
                <button onClick={logout} className="text-red-600 hover:underline">Log out</button>
            </div>
        </nav>
    );
}