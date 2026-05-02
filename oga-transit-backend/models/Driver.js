/**
 * models/Driver.js — Driver Model
 */

import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  userId:           { type: String, default: null },
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true },
  phone:            { type: String, default: "" },
  licenseNumber:    { type: String, required: true, unique: true },
  licenseExpiry:    { type: String, default: null },
  assignedBusId:    { type: String, default: null },
  assignedRouteId:  { type: String, default: null },
  status:           { type: String, enum: ["on-duty", "off-duty", "suspended"], default: "off-duty" },
  rating:           { type: Number, default: 0 },
  totalTrips:       { type: Number, default: 0 },
  joinDate:         { type: String, default: "" },
  avatar:           { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);