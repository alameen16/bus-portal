/**
 * pages/ProfilePage.jsx — Staff Profile & Change Password
 *
 * Shows logged-in staff's details and allows password change.
 */

import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage({ setCurrentPage }) {
  const { user } = useAuth();

  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");
  const [success,          setSuccess]          = useState("");

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const ROLE_LABELS = {
    superadmin: "Super Admin",
    localAdmin:  "Local Admin",
    staff:       "Staff",
    driver:      "Driver",
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage("Home")}
          className="text-green-700 text-sm mb-3 flex items-center gap-1 hover:text-green-800 transition-colors"
        >
          ← Back to Home
        </button>
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-1">
          Account
        </p>
        <h1 className="text-stone-900 font-black text-3xl">My Profile</h1>
      </div>

      {/* ── Profile Info ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center text-white font-black text-lg">
            {user?.avatar || "?"}
          </div>
          <div>
            <p className="font-black text-stone-900 text-lg">{user?.name}</p>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              user?.role === "superadmin" ? "bg-purple-100 text-purple-700" :
              user?.role === "localAdmin"  ? "bg-blue-100 text-blue-700" :
              user?.role === "driver"      ? "bg-green-100 text-green-700" :
              "bg-stone-100 text-stone-600"
            }`}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {[
            { label: "Email",  value: user?.email },
            { label: "Phone",  value: user?.phone || "—" },
            { label: "Status", value: user?.status },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
              <span className="text-stone-400 font-medium">{label}</span>
              <span className="font-semibold text-stone-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="font-bold text-stone-900 text-base mb-1">Change Password</h2>
        <p className="text-stone-400 text-xs mb-5">
          Make sure your new password is at least 6 characters.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:border-green-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold hover:text-green-600"
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:border-green-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold hover:text-green-600"
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50 focus:outline-none focus:border-green-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold hover:text-green-600"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Updating..." : "Change Password →"}
          </button>

        </form>
      </div>

    </div>
  );
}
