import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth.api.js";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "volunteer" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      navigate("/programs");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Register</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <input
          name="name" placeholder="Name" value={form.name} onChange={handleChange} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="volunteer">Volunteer</option>
          <option value="coordinator">Coordinator</option>
        </select>
        <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">
          Register
        </button>
        <p className="text-sm text-gray-500 text-center">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}