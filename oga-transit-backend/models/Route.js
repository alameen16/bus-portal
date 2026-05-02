/**
 * models/Route.js — Route Model
 */

import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  from:         { type: String, required: true },
  to:           { type: String, required: true },
  fromTerminal: { type: String, default: "" },
  toTerminal:   { type: String, default: "" },
  duration:     { type: String, default: "" },
  departures:   [{ type: String }],
  stops:        [{ type: String }],
  price:        { type: Number, default: 0 },
  status:       { type: String, enum: ["active", "inactive"], default: "active" },
  busId:        { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("Route", routeSchema);
