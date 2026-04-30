/**
 * routes/bookings.js — Bookings API
 * Staff (not admin) can create and view their own bookings.
 * superadmin + localAdmin can manage all bookings.
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "../utils/db.js";
import { verifyToken, requireRole, OPS_ROLES } from "../middleware/auth.js";

const router = Router();
const MAX_SEATS = 3;

/* ── TAKEN SEATS (live availability) ── */
router.get("/taken-seats", verifyToken, (req, res) => {
  const { routeId, date, departure } = req.query;
  if (!routeId || !date || !departure) {
    return res.status(400).json({ message: "routeId, date, and departure are required." });
  }
  const bookings = readDB("bookings");
  const takenSeats = bookings
    .filter(b =>
      b.routeId   === routeId &&
      b.date      === date &&
      b.departure === departure &&
      b.status    !== "cancelled" &&
      b.status    !== "refunded"
    )
    .flatMap(b => b.seats || [b.seat])
    .filter(Boolean);
  res.json({ takenSeats });
});

// GET /api/bookings/my?userId=u-cd3ecf
router.get("/my", verifyToken, (req, res) => {
  const { userId } = req.query;
  const bookings = readDB("bookings");
  const userBookings = bookings
    .filter(b => b.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ bookings: userBookings });
});

/* ── GET ALL BOOKINGS ──
   Admin → all bookings
   Staff/driver → own bookings only
*/
router.get("/", verifyToken, (req, res) => {
  const bookings = readDB("bookings");
  const routes   = readDB("routes");

  let result = bookings;

  // Non-admin users only see their own bookings
  if (!OPS_ROLES.includes(req.user.role)) {
    result = bookings.filter(b => b.userId === req.user.id);
  }

  if (req.query.status)  result = result.filter(b => b.status  === req.query.status);
  if (req.query.date)    result = result.filter(b => b.date    === req.query.date);
  if (req.query.routeId) result = result.filter(b => b.routeId === req.query.routeId);

  const enriched = result
    .map(b => ({ ...b, route: routes.find(r => r.id === b.routeId) || null }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(enriched);
});

/* ── GET ONE BOOKING ── */
router.get("/:id", verifyToken, (req, res) => {
  const bookings = readDB("bookings");
  const booking  = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found." });

  // Staff can only see their own
  if (!OPS_ROLES.includes(req.user.role) && booking.userId !== req.user.id) {
    return res.status(403).json({ message: "Access denied." });
  }

  const routes = readDB("routes");
  res.json({ ...booking, route: routes.find(r => r.id === booking.routeId) || null });
});

/* ── CREATE BOOKING (staff + admin) ── */
router.post("/", verifyToken, (req, res) => {
  const { routeId, passengerName, departure, date, seats, paymentMethod } = req.body;
  const seatsArray = Array.isArray(seats) ? seats : [seats].filter(Boolean);

  if (!routeId || !passengerName || !departure || !date || seatsArray.length === 0) {
    return res.status(400).json({ message: "routeId, passengerName, departure, date, and seats are required." });
  }
  if (seatsArray.length > MAX_SEATS) {
    return res.status(400).json({ message: `Maximum ${MAX_SEATS} seats per booking.` });
  }

  const routes   = readDB("routes");
  const bookings = readDB("bookings");
  const route    = routes.find(r => r.id === routeId);

  if (!route)                    return res.status(404).json({ message: "Route not found." });
  if (route.status !== "active") return res.status(400).json({ message: "This route is not active." });

  // Check taken seats
  const takenSeats = bookings
    .filter(b =>
      b.routeId   === routeId &&
      b.date      === date &&
      b.departure === departure &&
      b.status    !== "cancelled" &&
      b.status    !== "refunded"
    )
    .flatMap(b => b.seats || [b.seat])
    .filter(Boolean);

  const conflict = seatsArray.find(s => takenSeats.includes(Number(s)));
  if (conflict) {
    return res.status(409).json({ message: `Seat ${conflict} is already booked.` });
  }

  const ref = `OGA-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(4, "0")}`;

  const newBooking = {
    id:            `bk-${uuidv4().slice(0, 6)}`,
    userId:        req.user.id,
    passengerName,
    routeId,
    from:          route.from,
    to:            route.to,
    fromTerminal:  route.fromTerminal,
    toTerminal:    route.toTerminal,
    departure,
    date,
    seats:         seatsArray.map(Number),
    seat:          seatsArray[0],
    price:         route.price * seatsArray.length,
    pricePerSeat:  route.price,
    seatCount:     seatsArray.length,
    status:        "confirmed",
    paymentMethod: paymentMethod || "card",
    paymentStatus: "paid",
    bookingRef:    ref,
    createdAt:     new Date().toISOString(),
  };

  bookings.push(newBooking);
  writeDB("bookings", bookings);
  res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
});

/* ── UPDATE STATUS (admin only) ── */
router.patch("/:id/status", verifyToken, requireRole(OPS_ROLES), (req, res) => {
  const { status } = req.body;
  const valid = ["confirmed", "cancelled", "refunded", "pending"];
  if (!valid.includes(status)) {
    return res.status(400).json({ message: `Status must be: ${valid.join(", ")}` });
  }

  const bookings = readDB("bookings");
  const index    = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Booking not found." });

  bookings[index].status = status;
  if (status === "refunded") bookings[index].paymentStatus = "refunded";
  writeDB("bookings", bookings);

  res.json({ message: `Booking ${status}.`, booking: bookings[index] });
});

export default router;