/**
 * models/Driver.js — Driver Model
 */

import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, default: "" },
  licenseNo: { type: String, default: "" },
  status:    { type: String, enum: ["active", "inactive", "on-leave"], default: "active" },
  busId:     { type: String, default: null },
  userId:    { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
