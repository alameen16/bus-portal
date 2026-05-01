/**
 * pages/BookingsPage.jsx — Staff Shuttle Booking
 *
 * Free daily staff shuttle booking system.
 * One seat per staff per day.
 * Booking rules:
 *   - Before 2PM : can book
 *   - 2PM–4PM   : countdown shown, new bookings still allowed, no edits
 *   - After 4PM : bookings closed for the day
 *
 * Routes are fetched dynamically from the API.
 * If no routes exist, shows an empty state.
 */

import { useState, useEffect, useCallback } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import SeatPicker from "../components/SeatPicker";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const BASE_URL  = import.meta.env.VITE_API_URL + "/api";
const MAX_SEATS = 1;

// ── Time helpers ─────────────────────────────────────────
function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
const CUTOFF_OPEN  = 14 * 60;
const CUTOFF_CLOSE = 16 * 60;

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

function addHours(time, duration) {
  if (!time || !duration) return "—";
  try {
    const [h, m] = time.split(":").map(Number);
    const match  = duration.match(/(\d+)h\s*(\d+)?m?/);
    const addH   = parseInt(match?.[1] || 0);
    const addM   = parseInt(match?.[2] || 0);
    const total  = h * 60 + m + addH * 60 + addM;
    const arrH   = Math.floor(total / 60) % 24;
    const arrM   = total % 60;
    return `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;
  } catch { return "—"; }
}

// ── Main Component ───────────────────────────────────────
export default function BookingsPage({ route: propRoute, setCurrentPage }) {
  const { user } = useAuth();

  // ── Booking window state ──────────────────────────────
  const [bookingStatus, setBookingStatus] = useState(getBookingStatus());
  const [countdown,     setCountdown]     = useState(getSecondsUntilClose());

  useEffect(() => {
    const tick = setInterval(() => {
      setBookingStatus(getBookingStatus());
      setCountdown(getSecondsUntilClose());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Route — use prop if passed, else fetch first active route ──
  const [route,        setRoute]        = useState(propRoute || null);
  const [routeLoading, setRouteLoading] = useState(!propRoute);

  useEffect(() => {
    if (propRoute) { setRoute(propRoute); setRouteLoading(false); return; }
    fetch(`${BASE_URL}/routes/search`)
      .then(r => r.json())
      .then(data => {
        const routes = data.exact || [];
        setRoute(routes.length > 0 ? routes[0] : null);
      })
      .catch(() => setRoute(null))
      .finally(() => setRouteLoading(false));
  }, [propRoute]);

  const schedules = (route?.departures || []).map((time, i) => ({
    id:        i + 1,
    departure: time,
    arrival:   addHours(time, route?.duration),
    duration:  route?.duration,
  }));

  // ── Bus + seats ───────────────────────────────────────
  const [bus,        setBus]        = useState(null);
  const [busLoading, setBusLoading] = useState(true);
  const [takenSeats, setTakenSeats] = useState([]);

  const [selectedSchedule, setSelectedSchedule] = useState(0);
  const [selectedSeats,    setSelectedSeats]    = useState([]);

  const [isBooked, setIsBooked] = useState(false);
  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!route) { setBusLoading(false); return; }
    const busId = route.busId || route.bus?.id;
    if (!busId) { setBusLoading(false); return; }
    api.get(`/buses/${busId}`)
      .then(b  => setBus(b))
      .catch(() => setBus(null))
      .finally(() => setBusLoading(false));
  }, [route]);

  const fetchTakenSeats = useCallback(async () => {
    if (!route?.id || !schedules[selectedSchedule]) return;
    try {
      const dep = schedules[selectedSchedule].departure;
      const res = await api.get(
        `/bookings/taken-seats?routeId=${route.id}&date=${today}&departure=${dep}`
      );
      setTakenSeats(res.takenSeats || []);
    } catch { setTakenSeats([]); }
  }, [route?.id, selectedSchedule, today]);

  useEffect(() => {
    if (!route) return;
    fetchTakenSeats();
    const interval = setInterval(fetchTakenSeats, 8000);
    return () => clearInterval(interval);
  }, [fetchTakenSeats, route]);

  useEffect(() => {
    setSelectedSeats(prev => prev.filter(s => !takenSeats.includes(s)));
  }, [takenSeats]);

  function handleSeatClick(seatId) {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) return prev.filter(s => s !== seatId);
      if (prev.length >= MAX_SEATS) return prev;
      return [seatId];
    });
    setError("");
  }

  function handleScheduleChange(index) {
    setSelectedSchedule(index);
    setSelectedSeats([]);
    setError("");
  }

  async function handleConfirm() {
    if (selectedSeats.length === 0) { setError("Please select a seat."); return; }
    setLoading(true);
    setError("");
    try {
      const dep    = schedules[selectedSchedule].departure;
      const result = await api.post("/bookings", {
        routeId:       route.id,
        passengerName: user?.name,
        passengers:    [{ name: user?.name, phone: user?.phone || "", email: user?.email || "" }],
        departure:     dep,
        date:          today,
        seats:         selectedSeats,
      });
      setBooking(result.booking);
      setIsBooked(true);
    } catch (err) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state ─────────────────────────────────────
  if (routeLoading) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="text-4xl animate-bounce mb-4">🚌</div>
        <p className="text-stone-400 text-sm">Loading routes...</p>
      </div>
    );
  }

  // ── No routes available ───────────────────────────────
  if (!route) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-5">🚏</div>
        <h2 className="font-black text-2xl text-stone-900 mb-2">No Routes Available</h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          There are no active shuttle routes at the moment.<br />
          Please check back later or contact your administrator.
        </p>
        <button
          onClick={() => setCurrentPage("Home")}
          className="text-sm font-semibold text-green-700 border border-green-300 rounded-lg px-5 py-2.5 hover:bg-green-50 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Closed state ─────────────────────────────────────
  if (bookingStatus === "closed") {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-5">🚌</div>
        <h2 className="font-black text-2xl text-stone-900 mb-2">Bookings Closed</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          Daily shuttle bookings close at <strong>4:00 PM</strong>.<br />
          Come back tomorrow from <strong>12:00 AM</strong> to reserve your seat.
        </p>
        <button
          onClick={() => setCurrentPage("MyBookings")}
          className="mt-6 text-sm font-semibold text-green-700 border border-green-300 rounded-lg px-5 py-2.5 hover:bg-green-50 transition-colors"
        >
          View My Bookings →
        </button>
      </div>
    );
  }

  // ── Confirmation screen ───────────────────────────────
  if (isBooked && booking) {
    return (
      <BookingConfirmation
        booking={booking}
        onViewBookings={() => setCurrentPage("MyBookings")}
        onReset={() => { setIsBooked(false); setSelectedSeats([]); setBooking(null); }}
      />
    );
  }

  const busCapacity = bus?.capacity || route.bus?.capacity || 24;
  const hasBus      = !!(route.busId || route.bus?.id);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* ── Header ── */}
      <div className="mb-6">
        <button
          onClick={() => setCurrentPage("Home")}
          className="text-green-700 text-sm mb-3 flex items-center gap-1 hover:text-green-800 transition-colors"
        >
          ← Back to Home
        </button>
        <p className="text-green-700 text-xs font-bold uppercase tracking-widest mb-1">
          Staff Shuttle · Daily Booking
        </p>
        <h1 className="text-stone-900 font-black text-3xl">
          {route.from} → {route.to}
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {route.duration} ·Staff shuttle ·
        </p>
      </div>

      {/* ── Countdown banner (2PM–4PM) ── */}
      {bookingStatus === "countdown" && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-amber-800 font-bold text-sm">⏳ Booking closes soon</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Bookings can no longer be edited after 2:00 PM. New bookings are still allowed.
            </p>
          </div>
          <div className="bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 text-center">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-0.5">Closes in</p>
            <p className="text-amber-800 font-black text-xl tabular-nums">{formatCountdown(countdown)}</p>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════ LEFT ════ */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <LiveMapCard route={route} />

          <ScheduleList
            schedules={schedules}
            selectedSchedule={selectedSchedule}
            onSelect={handleScheduleChange}
          />

          <Card
            title={
              busLoading
                ? "Loading bus layout..."
                : bus
                  ? `${busCapacity}-Seater · ${bus.model || "Coach"} · Choose Your Seat`
                  : "Choose Your Seat"
            }
            className="p-5"
          >
            {!busLoading && bus && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                   {bus.plateNumber}
                </span>
                {bus.amenities?.length > 0 && (
                  <span className="text-stone-400 text-xs">{bus.amenities.join(" · ")}</span>
                )}
              </div>
            )}

            {!hasBus ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                <p className="text-3xl mb-3">🚌</p>
                <p className="font-semibold text-stone-500">No bus assigned to this route yet.</p>
                <p className="text-xs mt-1">Please check back later or contact admin.</p>
              </div>
            ) : (
              <SeatPicker
                capacity={busCapacity}
                takenSeats={takenSeats}
                selectedSeats={selectedSeats}
                onSelectSeat={handleSeatClick}
                maxSeats={MAX_SEATS}
              />
            )}
          </Card>
        </div>

        {/* ════ RIGHT ════ */}
        <div className="flex flex-col gap-4">
          <BookingSummary
            route={route}
            schedule={schedules[selectedSchedule]}
            selectedSeats={selectedSeats}
            user={user}
            onConfirm={handleConfirm}
            loading={loading}
            onViewBookings={() => setCurrentPage("MyBookings")}
          />
        </div>

      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   LIVE MAP CARD
───────────────────────────────────────────── */
function LiveMapCard({ route }) {
  const stops = route.stops || [];
  return (
    <div className="relative rounded-2xl overflow-hidden bg-green-950 h-56">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "linear-gradient(rgba(74,222,128,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.4) 1px, transparent 1px)",
        backgroundSize:  "40px 40px",
      }} />
      <div className="absolute top-1/2 left-16 right-16 h-0.5 bg-green-400/70 -translate-y-1/2" />
      <div className="absolute top-1/2 left-16  w-4 h-4 rounded-full bg-green-400 border-2 border-white -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2">
        <div className="w-5 h-5 rounded-full bg-green-400 border-2 border-white animate-pulse" />
      </div>
      <div className="absolute top-1/2 right-16 w-4 h-4 rounded-full bg-amber-400 border-2 border-white -translate-y-1/2 translate-x-1/2" />
      <div className="absolute top-4 right-4 bg-black/50 rounded-xl p-3 text-xs text-white space-y-1.5 backdrop-blur-sm">
        <p className="text-green-400 font-bold text-xs uppercase tracking-widest mb-1">Stops</p>
        {[route.from, ...stops, route.to].map((stop, i, arr) => (
          <div key={`${stop}-${i}`} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${i < arr.length - 1 ? "bg-green-400/60" : "bg-amber-400/60"}`} />
            <span className="text-white/80">{stop}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-950 to-transparent p-5">
        <h2 className="text-white font-black text-xl">{route.from} → {route.to} Express</h2>
        <p className="text-white/50 text-xs">{route.fromTerminal} → {route.toTerminal}</p>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   SCHEDULE LIST
───────────────────────────────────────────── */
function ScheduleList({ schedules, selectedSchedule, onSelect }) {
  return (
    <Card title="Departure Time">
      {schedules.length === 0 ? (
        <p className="px-5 py-4 text-stone-400 text-sm">No departures available for this route.</p>
      ) : (
        schedules.map((schedule, index) => {
          const isSelected = selectedSchedule === index;
          return (
            <div
              key={schedule.id}
              onClick={() => onSelect(index)}
              className={`
                flex items-center gap-4 px-5 py-4 cursor-pointer
                border-b border-stone-100 last:border-b-0 transition-colors duration-150
                ${isSelected ? "bg-green-50" : "hover:bg-stone-50"}
              `}
            >
              <span className="font-black text-stone-900 text-xl w-16">{schedule.departure}</span>
              <div className="flex-1">
                <p className="text-stone-400 text-xs">{schedule.duration} · Direct</p>
              </div>
              <span className="font-bold text-stone-800 text-lg">{schedule.arrival}</span>
              <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                isSelected
                  ? "bg-green-700 text-white"
                  : "border border-green-600 text-green-700 hover:bg-green-50"
              }`}>
                {isSelected ? "✓ Selected" : "Select"}
              </button>
            </div>
          );
        })
      )}
    </Card>
  );
}


/* ─────────────────────────────────────────────
   BOOKING SUMMARY
───────────────────────────────────────────── */
function BookingSummary({ route, schedule, selectedSeats, user, onConfirm, loading, onViewBookings }) {
  const seatCount = selectedSeats.length;
  const canBook   = seatCount > 0 && !loading;

  return (
    <Card title="Your Booking" className="p-5">

      <div className="mb-5 border border-stone-200 rounded-xl p-4 bg-stone-50">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Booking For</p>
        <p className="font-bold text-stone-800 text-sm">{user?.name || "—"}</p>
        {user?.email && <p className="text-stone-400 text-xs mt-0.5">{user.email}</p>}
        {user?.phone && <p className="text-stone-400 text-xs">{user.phone}</p>}
      </div>

      <div className="bg-stone-50 rounded-xl p-3 mb-5 border border-stone-100 text-xs">
        <p className="text-stone-500 mb-1">
          <span className="font-semibold text-stone-700">{route.from} → {route.to}</span>
          {" · "}Departs <span className="font-semibold text-stone-700">{schedule?.departure || "—"}</span>
          {" · "}Arrives <span className="font-semibold text-stone-700">{schedule?.arrival || "—"}</span>
        </p>
        {seatCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedSeats.map(s => (
              <span key={s} className="bg-green-100 border border-green-300 text-green-700 font-bold px-2 py-0.5 rounded-md">
                Seat #{s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-green-700 text-sm font-semibold">Staff Shuttle</span>
        <span className="text-green-700 font-black text-lg">FREE</span>
      </div>

      <Button
        fullWidth
        onClick={onConfirm}
        className={!canBook ? "opacity-50 cursor-not-allowed" : ""}
      >
        {loading ? "Reserving..." : seatCount === 0 ? "Select a Seat First" : "Reserve My Seat →"}
      </Button>

      <button
        onClick={onViewBookings}
        className="w-full mt-3 text-sm text-green-700 font-semibold hover:underline text-center"
      >
        View My Bookings →
      </button>

    </Card>
  );
}


/* ─────────────────────────────────────────────
   BOOKING CONFIRMATION
───────────────────────────────────────────── */
function BookingConfirmation({ booking, onViewBookings, onReset }) {
  const seats = booking.seats?.length > 0 ? booking.seats : [booking.seat].filter(Boolean);

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="text-6xl mb-6">✅</div>
      <h2 className="font-black text-3xl text-stone-900 mb-2">Seat Reserved!</h2>
      <p className="text-stone-500 text-sm mb-8">
        Your shuttle seat is confirmed. Show this reference to the driver.
      </p>

      <div className="bg-green-950 rounded-2xl p-5 text-left text-white mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Booking Ref</p>
            <p className="font-black text-2xl tracking-wider">{booking.bookingRef}</p>
          </div>
          <span className="bg-green-600 px-3 py-1 rounded-xl text-xs font-bold">CONFIRMED</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Route",     `${booking.from} → ${booking.to}`],
            ["Date",      booking.date],
            ["Departure", booking.departure],
            ["Staff",     booking.passengerName],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-green-400/60 text-xs mb-0.5">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
          <div className="col-span-2">
            <p className="text-green-400/60 text-xs mb-1">Seat</p>
            <div className="flex flex-wrap gap-1.5">
              {seats.map(s => (
                <span key={s} className="bg-green-700 px-2.5 py-0.5 rounded font-bold text-xs">#{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onViewBookings} fullWidth>View My Bookings</Button>
        <button
          onClick={onReset}
          className="flex-1 border border-stone-200 text-stone-700 font-bold py-2.5 rounded-xl hover:bg-stone-50 text-sm transition-colors"
        >
          Book Again
        </button>
      </div>
    </div>
  );
}