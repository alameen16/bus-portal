/**
 * pages/LoginPage.jsx — Unified Login Page
 *
 * One login form for ALL user types.
 * Supports login with email OR phone number.
 * After login, the app automatically redirects based on role:
 *   superadmin / localAdmin → Admin Dashboard
 *   driver                  → Driver Dashboard
 *   staff                   → Home Page
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ setCurrentPage }) {
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      if (["superadmin", "localAdmin"].includes(user.role)) {
        setCurrentPage("AdminStaff");
      } else if (user.role === "driver") {
        setCurrentPage("DriverDashboard");
      } else {
        setCurrentPage("Home");
      }
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center px-4">

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #4ade80 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-white font-black text-3xl tracking-widest mb-1">🚌 OGA TRANSIT</h1>
          <p className="text-green-400 text-sm">Nigeria's Premium Bus Network</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-black text-stone-900 text-xl mb-1">Welcome back</h2>
          <p className="text-stone-500 text-sm mb-6">Sign in to your account</p>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              ⚠️ {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email or Phone */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email or phone number"
                required
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:border-green-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold hover:text-green-600"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>

          </form>

        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <button
            onClick={() => setCurrentPage("Home")}
            className="text-green-400 text-sm hover:text-green-300 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}