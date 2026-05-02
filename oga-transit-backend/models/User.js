/**
 * models/User.js — User Model
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["superadmin", "localAdmin", "driver", "staff",], default: "staff" },
  phone:     { type: String, default: "" },
  avatar:    { type: String, default: "" },
  status:    { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
