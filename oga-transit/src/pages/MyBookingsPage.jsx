/**
 * pages/MyBookingsPage.jsx — Staff's Personal Bookings
 *
 * Shows today's active booking + past bookings.
 * Edit (seat only) and Cancel allowed only before 2PM.
 * After 2PM bookings are locked — read only.
 */

import { useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import SeatPicker from "../components/SeatPicker";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ── Time helpers ─────────────────────────────────────────
function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
const CUTOFF_OPEN  = 14 * 60; // 2:00 PM
const CUTOFF_CLOSE = 16 * 60; // 4:00 PM

function getBookingStatus() {
  const now = getNowMinutes();
  if (now < CUTOFF_OPEN)  return "open";
  if (now < CUTOFF_CLOSE) return "countdown";
  return "closed";
}

function getSecondsUntilClose() {
  const now   = new Date();
  const close = new Date();
  close.setHours(16, 0, 0, 0);
  return Math.max(0, Math.floor((close - now) / 1000));
}

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MyBookingsPage({ setCurrentPage }) {
  const { user } = useAuth();

  const [bookingStatus, setBookingStatus] = useState(getBookingStatus());
  const [countdown,     setCountdown]     = useState(getSecondsUntilClose());

  const [todayBooking,  setTodayBooking]  = useState(null);
  const [pastBookings,  setPastBookings]  = useState([]);
  const [pageLoading,   setPageLoading]   = useState(true);

  // Edit mode state
  const [editing,       setEditing]       = useState(false);
  const [takenSeats,    setTakenSeats]    = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [editLoading,   setEditLoading]   = useState(false);
  const [editError,     setEditError]     = useState("");
  const [editSuccess,   setEditSuccess]   = useState(false);

  // Cancel state
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError,   setCancelError]   = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ── Tick countdown ────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setBookingStatus(getBookingStatus());
      setCountdown(getSecondsUntilClose());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Fetch bookings ────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/my?userId=${user?.id}`);
      const all = res.bookings || [];
      setTodayBooking(all.find(b => b.date === today) || null);
      setPastBookings(all.filter(b => b.date !== today));
    } catch {
      setTodayBooking(null);
      setPastBookings([]);
    } finally {
      setPageLoading(false);
    }
  }, [user?.id, today]);

  // AFTER
useEffect(() => { 
  if (!user?.id) return;
  fetchBookings(); 
}, [fetchBookings, user?.id]);

  // ── Fetch taken seats for editing ────────────────────
  const fetchTakenSeats = useCallback(async () => {
    if (!todayBooking) return;
    try {
      const res = await api.get(
        `/bookings/taken-seats?routeId=${todayBooking.routeId}&date=${today}&departure=${todayBooking.departure}`
      );
      // Exclude the user's own current seat from taken seats so they can re-select it
      const taken = (res.takenSeats || []).filter(s => !todayBooking.seats?.includes(s));
      setTakenSeats(taken);
    } catch { setTakenSeats([]); }
  }, [todayBooking, today]);

  useEffect(() => {
    if (editing) fetchTakenSeats();
  }, [editing, fetchTakenSeats]);

  // ── Start editing ─────────────────────────────────────
  function startEdit() {
    setSelectedSeats(todayBooking?.seats || []);
    setEditError("");
    setEditSuccess(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError("");
    setSelectedSeats([]);
  }

  // ── Save new seat ─────────────────────────────────────
  async function handleSaveEdit() {
    if (selectedSeats.length === 0) { setEditError("Please select a seat."); return; }
    setEditLoading(true);
    setEditError("");
    try {
      await api.patch(`/bookings/${todayBooking.id}`, { seats: selectedSeats });
      setEditSuccess(true);
      setEditing(false);
      await fetchBookings();
    } catch (err) {
      setEditError(err.message || "Failed to update seat. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Cancel booking ────────────────────────────────────
  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel your shuttle booking for today?")) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await api.delete(`/bookings/${todayBooking.id}`);
      setTodayBooking(null);
    } catch (err) {
      setCancelError(err.message || "Failed to cancel. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  const canEdit = bookingStatus === "open";

  // ── Loading ───────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-4xl animate-bounce mb-4">🚌</div>
        <p className="text-stone-400 text-sm">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage("Home")}
          className="text-green-700 text-sm mb-3 flex items-center gap-1 hover:text-green-800 transition-colors"
        >
          ← Back to Home
        </button>
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-1">
          Staff Shuttle
        </p>
        <h1 className="text-stone-900 font-black text-3xl">My Bookings</h1>
      </div>

      {/* ── Countdown banner ── */}
      {bookingStatus === "countdown" && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-amber-800 font-bold text-sm">⏳ Booking closes soon</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Bookings can no longer be edited after 2:00 PM.
            </p>
          </div>
          <div className="bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 text-center">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-0.5">Closes in</p>
            <p className="text-amber-800 font-black text-xl tabular-nums">{formatCountdown(countdown)}</p>
          </div>
        </div>
      )}

      {bookingStatus === "closed" && (
        <div className="bg-stone-100 border border-stone-300 rounded-xl px-5 py-4 mb-6">
          <p className="text-stone-600 font-bold text-sm">🔒 Bookings closed for today</p>
          <p className="text-stone-400 text-xs mt-0.5">
            Daily shuttle bookings reopen tomorrow from 12:00 AM.
          </p>
        </div>
      )}

      {/* ── Today's booking ── */}
      <div className="mb-8">
        <h2 className="text-stone-700 font-bold text-sm uppercase tracking-widest mb-3">
          Today's Shuttle
        </h2>

        {editSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            ✅ Seat updated successfully!
          </div>
        )}

        {cancelError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {cancelError}
          </div>
        )}

        {!todayBooking ? (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8 text-center">
            <p className="text-3xl mb-3">🎟️</p>
            <p className="font-semibold text-stone-600 text-sm mb-1">No booking for today</p>
            <p className="text-stone-400 text-xs mb-5">
              {bookingStatus === "closed"
                ? "Bookings are closed for today."
                : "Reserve your shuttle seat before 4:00 PM."}
            </p>
            {bookingStatus !== "closed" && (
              <button
                onClick={() => setCurrentPage("Bookings")}
                className="text-sm font-bold text-white bg-green-700 rounded-lg px-5 py-2.5 hover:bg-green-800 transition-colors"
              >
                Book Now →
              </button>
            )}
          </div>
        ) : editing ? (
          /* ── Edit seat UI ── */
          <Card title="Choose a New Seat" className="p-5">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                ⚠️ {editError}
              </div>
            )}
            <p className="text-stone-500 text-xs mb-4">
              Your current seat: {" "}
              {todayBooking.seats?.map(s => (
                <span key={s} className="bg-stone-100 border border-stone-300 text-stone-600 font-bold text-xs px-2 py-0.5 rounded-md mr-1">
                  #{s}
                </span>
              ))}
            </p>

            <SeatPicker
              capacity={todayBooking.busCapacity || 24}
              takenSeats={takenSeats}
              selectedSeats={selectedSeats}
              onSelectSeat={(seatId) => setSelectedSeats([seatId])}
              maxSeats={1}
            />

            <div className="flex gap-3 mt-5">
              <Button
                fullWidth
                onClick={handleSaveEdit}
                className={editLoading ? "opacity-50 cursor-not-allowed" : ""}
              >
                {editLoading ? "Saving..." : "Save New Seat →"}
              </Button>
              <button
                onClick={cancelEdit}
                className="flex-1 border border-stone-200 text-stone-600 font-bold py-2.5 rounded-xl hover:bg-stone-50 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        ) : (
          /* ── Today's booking card ── */
          <div className="bg-green-950 rounded-2xl p-5 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Booking Ref</p>
                <p className="font-black text-2xl tracking-wider">{todayBooking.bookingRef}</p>
              </div>
              <span className="bg-green-600 px-3 py-1 rounded-xl text-xs font-bold">CONFIRMED</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {[
                ["Route",     `${todayBooking.from} → ${todayBooking.to}`],
                ["Date",      todayBooking.date],
                ["Departure", todayBooking.departure],
                ["Staff",     todayBooking.passengerName],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-green-400/60 text-xs mb-0.5">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}

              <div className="col-span-2">
                <p className="text-green-400/60 text-xs mb-1">Seat</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayBooking.seats?.map(s => (
                    <span key={s} className="bg-green-700 px-2.5 py-0.5 rounded font-bold text-xs">
                      #{s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Edit / Cancel — only before 2PM */}
            {canEdit ? (
              <div className="flex gap-3 pt-3 border-t border-green-800">
                <button
                  onClick={startEdit}
                  className="flex-1 bg-green-800 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  ✏️ Change Seat
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelLoading ? "Cancelling..." : "🗑 Cancel Booking"}
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-green-800">
                <p className="text-amber-400 text-xs text-center">
                  🔒 Bookings cannot be edited after 2:00 PM
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Past bookings ── */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-stone-700 font-bold text-sm uppercase tracking-widest mb-3">
            Past Bookings
          </h2>
          <div className="flex flex-col gap-3">
            {pastBookings.map(b => (
              <div
                key={b.id}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-stone-800 text-sm">{b.from} → {b.to}</p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {b.date} · Departs {b.departure} · {" "}
                    {b.seats?.map(s => `Seat #${s}`).join(", ")}
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-400 border border-stone-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                  {b.bookingRef}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
