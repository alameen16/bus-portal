/**
 * routes/bookings.js — Bookings API (MongoDB version)
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import Booking from "../models/Booking.js";
import Route from "../models/Route.js";
import { verifyToken, requireRole, OPS_ROLES } from "../middleware/auth.js";

const router = Router();
const MAX_SEATS = 1;

/* ── TAKEN SEATS ── */
router.get("/taken-seats", verifyToken, async (req, res) => {
  try {
    const { routeId, date, departure } = req.query;
    if (!routeId || !date || !departure)
      return res.status(400).json({ message: "routeId, date, and departure are required." });

    const bookings = await Booking.find({
      routeId, date, departure,
      status: { $nin: ["cancelled"] },
    });

    const takenSeats = bookings.flatMap(b => b.seats?.length ? b.seats : [b.seat]).filter(Boolean);
    res.json({ takenSeats });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch taken seats." });
  }
});

/* ── MY BOOKINGS ── */
router.get("/my", verifyToken, async (req, res) => {
  try {
    // Use verified token instead of query param for security
    const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

/* ── GET ALL BOOKINGS ── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (!OPS_ROLES.includes(req.user.role)) filter.userId = req.user.id;
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.date)    filter.date    = req.query.date;
    if (req.query.routeId) filter.routeId = req.query.routeId;

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

/* ── GET ONE BOOKING ── */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (!OPS_ROLES.includes(req.user.role) && booking.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied." });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking." });
  }
});

/* ── CREATE BOOKING ── */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { routeId, passengerName, departure, date, seats } = req.body;
    const seatsArray = Array.isArray(seats) ? seats : [seats].filter(Boolean);

    if (!routeId || !passengerName || !departure || !date || seatsArray.length === 0)
      return res.status(400).json({ message: "routeId, passengerName, departure, date, and seats are required." });

    if (seatsArray.length > MAX_SEATS)
      return res.status(400).json({ message: `Maximum ${MAX_SEATS} seats per booking.` });

    const route = await Route.findOne({ id: routeId });
    if (!route)                    return res.status(404).json({ message: "Route not found." });
    if (route.status !== "active") return res.status(400).json({ message: "This route is not active." });

    // Prevent duplicate booking: one booking per user per day
    const existing = await Booking.findOne({
      userId: req.user.id,
      date,
      status: { $nin: ["cancelled"] },
    });
    if (existing) {
      return res.status(409).json({
        message: "You already have a booking for today. Please edit or cancel your existing booking.",
        bookingRef: existing.bookingRef,
      });
    }

    // Check seat conflicts
    const takenBookings = await Booking.find({
      routeId, date, departure,
      status: { $nin: ["cancelled"] },
    });
    const takenSeats = takenBookings.flatMap(b => b.seats?.length ? b.seats : [b.seat]).filter(Boolean);
    const conflict = seatsArray.find(s => takenSeats.includes(Number(s)));
    if (conflict)
      return res.status(409).json({ message: `Seat ${conflict} is already booked.` });

    const count = await Booking.countDocuments();
    const ref   = `BUS-${String(count + 1).padStart(4, "0")}`;

    const newBooking = await Booking.create({
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
      seatCount:     seatsArray.length,
      status:        "confirmed",
      bookingRef:    ref,
    });

    res.status(201).json({ message: "Booking confirmed!", booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: "Booking failed. Please try again." });
  }
});

/* ── UPDATE SEATS (staff — own booking, before 2PM) ── */
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { seats } = req.body;
    const seatsArray = Array.isArray(seats) ? seats : [seats].filter(Boolean);
    if (seatsArray.length === 0)
      return res.status(400).json({ message: "seats are required." });

    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (!OPS_ROLES.includes(req.user.role) && booking.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied." });

    // Enforce 2PM cutoff for non-admins.
    const now    = new Date();
    const cutoff = new Date();
    cutoff.setHours(14, 0, 0, 0);
    if (now >= cutoff && !OPS_ROLES.includes(req.user.role))
      return res.status(403).json({ message: "Bookings cannot be edited after 2:00 PM." });


    // Check seat conflicts excluding current booking
    const takenBookings = await Booking.find({
      routeId:   booking.routeId,
      date:      booking.date,
      departure: booking.departure,
      status:    { $nin: ["cancelled"] },
      id:        { $ne: booking.id },
    });
    const takenSeats = takenBookings.flatMap(b => b.seats?.length ? b.seats : [b.seat]).filter(Boolean);
    const conflict = seatsArray.find(s => takenSeats.includes(Number(s)));
    if (conflict)
      return res.status(409).json({ message: `Seat ${conflict} is already booked.` });

    booking.seats     = seatsArray.map(Number);
    booking.seat      = seatsArray[0];
    booking.seatCount = seatsArray.length;
    await booking.save();

    res.json({ message: "Seat updated successfully.", booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to update seat." });
  }
});

/* ── UPDATE STATUS (admin only) ── */
router.patch("/:id/status", verifyToken, requireRole(OPS_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["confirmed", "cancelled"];
    if (!valid.includes(status))
      return res.status(400).json({ message: `Status must be: ${valid.join(", ")}` });

    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking ${status}.`, booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to update booking status." });
  }
});

/* ── CANCEL BOOKING ── */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    if (!OPS_ROLES.includes(req.user.role) && booking.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied." });

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled." });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel booking." });
  }
});

export default router;