/**
 * models/Route.js — Route Model
 */

import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  from:         { type: String, required: true },
  to:           { type: String, required: true },
  departures:   [{ type: String }],
  stops:        [{ type: String }],
  status:       { type: String, enum: ["active", "inactive"], default: "active" },
  busId:        { type: String, default: null },
  driverId:     { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("Route", routeSchema);