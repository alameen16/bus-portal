/**
 * pages/driver/DriverDashboard.jsx — Driver Portal
 *
 * What a driver sees when they log in:
 *   - Their assigned bus and route for today
 *   - Trip schedule (departure times + passenger counts)
 *   - Their personal stats (rating, total trips)
 *   - Quick status toggle (on-duty / off-duty)
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

export default function DriverDashboard({ setCurrentPage }) {
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      // Get this driver's own profile without needing admin access
      const myDriver = await api.get("/drivers/me");

      if (!myDriver) {
        setError("No driver profile found for your account. Contact admin.");
        return;
      }

      // Now get the full schedule for this driver
      const data = await api.get(`/drivers/${myDriver.id}/schedule`);
      setSchedule(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setCurrentPage("Home");
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-stone-100">

      {/* ── Top Bar ── */}
      <header className="bg-green-950 text-white px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest">🚌 Oga Transit</p>
            <h1 className="font-black text-lg">Driver Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-green-400 text-xs">Driver</p>
            </div>
            <button onClick={handleLogout} className="text-xs text-green-300 hover:text-red-400 transition-colors font-semibold">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">⚠️ {error}</div>
        )}

        {schedule && (
          <>
            {/* ── Today's Date ── */}
            <div className="bg-green-950 rounded-2xl p-5 text-white">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Today's Assignment</p>
              <p className="text-white/60 text-sm">{new Date(schedule.todayDate).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {/* ── Assigned Route ── */}
            {schedule.assignedRoute ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-3">Your Route Today</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🗺</div>
                  <div>
                    <h2 className="font-black text-stone-900 text-xl">
                      {schedule.assignedRoute.from} → {schedule.assignedRoute.to}
                    </h2>
                    <p className="text-stone-500 text-sm">{schedule.assignedRoute.distance} · {schedule.assignedRoute.duration}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="From Terminal" value={schedule.assignedRoute.fromTerminal} />
                  <InfoRow label="To Terminal"   value={schedule.assignedRoute.toTerminal}   />
                  <InfoRow label="Ticket Price"  value={`₦${schedule.assignedRoute.price?.toLocaleString()}`} />
                  <InfoRow label="Stops"         value={schedule.assignedRoute.stops?.join(", ") || "Non-stop"} />
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                <p className="text-4xl mb-2">😴</p>
                <p className="font-bold text-amber-800">No route assigned today</p>
                <p className="text-amber-600 text-sm">Contact your operations manager.</p>
              </div>
            )}

            {/* ── Assigned Bus ── */}
            {schedule.assignedBus && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-3">Your Bus</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🚌</div>
                  <div>
                    <h3 className="font-black text-stone-900 text-lg">{schedule.assignedBus.plateNumber}</h3>
                    <p className="text-stone-500 text-sm">{schedule.assignedBus.model} · {schedule.assignedBus.year}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Capacity"      value={`${schedule.assignedBus.capacity} seats`} />
                  <InfoRow label="Amenities"     value={schedule.assignedBus.amenities?.join(", ") || "Standard"} />
                  <InfoRow label="Last Service"  value={schedule.assignedBus.lastMaintenance || "—"} />
                  <InfoRow label="Next Service"  value={schedule.assignedBus.nextMaintenance || "—"} />
                </div>
              </div>
            )}

            {/* ── Trip Schedule ── */}
            {schedule.schedule?.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-stone-900">Today's Trips</p>
                    <p className="text-stone-400 text-xs">{schedule.totalTripsToday} departures · {schedule.totalPassengersToday} passengers booked</p>
                  </div>
                </div>
                <div className="divide-y divide-stone-100">
                  {schedule.schedule.map((trip, i) => {
                    const loadPct = Math.round((trip.passengers / trip.capacity) * 100);
                    const isNext = i === 0; // first trip is the next one

                    return (
                      <div key={i} className={`px-5 py-4 flex items-center gap-4 ${isNext ? "bg-green-50" : ""}`}>
                        {/* Time */}
                        <div className="w-16 text-center">
                          <p className="font-black text-stone-900 text-lg">{trip.time}</p>
                          {isNext && <p className="text-xs text-green-600 font-bold">NEXT</p>}
                        </div>

                        {/* Capacity bar */}
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>{trip.passengers} passengers booked</span>
                            <span>{loadPct}% full</span>
                          </div>
                          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${loadPct > 90 ? "bg-red-500" : loadPct > 70 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${loadPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Seats remaining */}
                        <div className="text-right w-20">
                          <p className="font-bold text-stone-800">{trip.capacity - trip.passengers}</p>
                          <p className="text-xs text-stone-400">seats left</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Driver Stats ── */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-3">Your Performance</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-black text-2xl text-stone-900">{schedule.driver?.totalTrips || 0}</p>
                  <p className="text-xs text-stone-400 font-semibold">Total Trips</p>
                </div>
                <div>
                  <p className="font-black text-2xl text-amber-500">★ {schedule.driver?.rating || "—"}</p>
                  <p className="text-xs text-stone-400 font-semibold">Rating</p>
                </div>
                <div>
                  <p className={`font-black text-lg capitalize ${schedule.driver?.status === "on-duty" ? "text-green-600" : "text-stone-400"}`}>
                    {schedule.driver?.status || "—"}
                  </p>
                  <p className="text-xs text-stone-400 font-semibold">Status</p>
                </div>
              </div>
            </div>

            {/* ── Emergency Info ── */}
            {schedule.driver?.emergencyContact && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-red-700 text-xs font-bold uppercase tracking-widest mb-1">Emergency Contact</p>
                <p className="text-red-800 font-semibold text-sm">{schedule.driver.emergencyContact}</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="bg-stone-50 rounded-lg p-3">
      <p className="text-stone-400 text-xs font-semibold uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-stone-800 font-semibold text-sm">{value}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🚌</div>
        <p className="text-stone-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}