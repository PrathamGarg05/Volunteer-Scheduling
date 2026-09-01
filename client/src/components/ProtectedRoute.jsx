import {Navigate} from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function ProtectedRoute({children, allowedRoles}){
    const {user, loading} = useAuth();

    if (loading) return <p>Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/programs" replace />;
    }

    return children;
}
