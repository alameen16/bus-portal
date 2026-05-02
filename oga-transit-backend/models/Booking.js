/**
 * models/Booking.js — Booking Model
 */

import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  userId:        { type: String, required: true },
  passengerName: { type: String, required: true },
  routeId:       { type: String, required: true },
  from:          { type: String, default: "" },
  to:            { type: String, default: "" },
  fromTerminal:  { type: String, default: "" },
  toTerminal:    { type: String, default: "" },
  departure:     { type: String, required: true },
  date:          { type: String, required: true },
  seats:         [{ type: Number }],
  seat:          { type: Number, default: null },
  price:         { type: Number, default: 0 },
  pricePerSeat:  { type: Number, default: 0 },
  seatCount:     { type: Number, default: 1 },
  status:        { type: String, enum: ["confirmed", "cancelled", "refunded", "pending"], default: "confirmed" },
  paymentMethod: { type: String, default: "card" },
  paymentStatus: { type: String, default: "paid" },
  bookingRef:    { type: String, required: true, unique: true },
  busCapacity:   { type: Number, default: 24 },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
