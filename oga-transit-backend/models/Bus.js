/**
 * models/Bus.js — Bus Model
 */

import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  plateNumber: { type: String, required: true, unique: true },
  model:       { type: String, default: "" },
  capacity:    { type: Number, required: true },
  status:      { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
  amenities:   [{ type: String }],
  driverId:    { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("Bus", busSchema);
