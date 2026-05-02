/**
 * utils/seed.js — One-time seed script
 * Migrates existing users.json into MongoDB.
 * Run once with: node utils/seed.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const users = [
  {
    id: "u-001",
    name: "Emeka Okafor",
    email: "admin@ogatransit.ng",
    password: "$2a$10$cgDDJ10IhPJWZ9KP27yBTOsuJZE6ewtAIuZ8Xc3z11zQMn8xeMcI2",
    role: "superadmin",
    phone: "08012345678",
    avatar: "EO",
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "u-004",
    name: "Chidi Okeke",
    email: "user@ogatransit.ng",
    password: "$2a$10$cgDDJ10IhPJWZ9KP27yBTOsuJZE6ewtAIuZ8Xc3z11zQMn8xeMcI2",
    role: "staff",
    phone: "08045678901",
    avatar: "CO",
    status: "active",
    createdAt: "2024-01-04T00:00:00.000Z"
  },
  {
    id: "u-b91a1f",
    name: "Al ameen Akintola",
    email: "akintolaalameen5@OGAdriver.com",
    password: "$2a$10$79BjOZDGwVT13saKSnVRK.iFXHsfnI80E.2Ry8GB9x1Z4wzWeRipO",
    role: "driver",
    phone: "07042225803",
    avatar: "AA",
    status: "active",
    createdAt: "2026-04-24T18:16:46.991Z"
  },
  {
    id: "u-231005",
    name: "Sobolawale Opeyemi",
    email: "digitestsnr8@gmail.com",
    password: "$2a$10$LPo15RnG7pHcvziV6hsH9uPitpbwuqolWWTqKr124eW9egRCdenCm",
    role: "staff",
    phone: "08024213587",
    avatar: "SO",
    status: "active",
    createdAt: "2026-04-27T11:08:11.079Z"
  },
  {
    id: "u-c9906b",
    name: "Stephen",
    email: "user223@gmail.com",
    password: "$2a$10$PaMnn1INLxaznsGlvFnnsuUTHE9rMJSXiPO0oBPGZCCYFFkTizSnm",
    role: "staff",
    phone: "08107221411",
    avatar: "S",
    status: "active",
    createdAt: "2026-04-27T11:14:36.134Z"
  },
  {
    id: "u-cd3ecf",
    name: "Al ameen Akintola",
    email: "akintolaalameen5@gmail.com",
    password: "$2a$10$sAKWYD08fK1AYOwkbZ/MI.XFg0ETSqUjNXWuwi21Fu0A5TCgLDmMO",
    role: "superadmin",
    phone: "07042225803",
    avatar: "AA",
    status: "active",
    createdAt: "2026-04-27T12:03:38.232Z"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    for (const user of users) {
      await User.findOneAndUpdate(
        { id: user.id },
        user,
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded user: ${user.email}`);
    }

    console.log("\n🎉 All users seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
