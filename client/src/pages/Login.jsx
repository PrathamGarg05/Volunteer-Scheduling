import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth.api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginUser({ email, password });
      login(res.data.token, res.data.user);
      navigate("/programs");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Login</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">
          Log in
        </button>
        <p className="text-sm text-gray-500 text-center">
          No account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}