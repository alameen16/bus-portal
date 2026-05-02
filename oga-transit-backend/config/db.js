/**
 * config/db.js — MongoDB Connection
 * Connects to MongoDB Atlas using the MONGODB_URI env variable.
 */

import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
