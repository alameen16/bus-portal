/**
 * server.js — Main Express Server
 *
 * This is the entry point for the entire backend.
 * It sets up Express, connects all the route files,
 * and starts listening for requests.
 *
 * To start: npm run dev
 * Server runs at: http://localhost:5000
 */

import "dotenv/config";
import express    from "express";
import cors       from "cors";

// Import all route handlers
import authRoutes    from "./routes/auth.js";
import routeRoutes   from "./routes/routes.js";
import busRoutes     from "./routes/buses.js";
import driverRoutes  from "./routes/drivers.js";
import bookingRoutes from "./routes/bookings.js";
import staffRoutes   from "./routes/staff.js";

// Create the Express app
const app  = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────────────────────
   MIDDLEWARE
   These run on EVERY request before the route handlers
───────────────────────────────────────────── */

// Allow requests from the React frontend (localhost:5173)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://bus-portal-rho.vercel.app"  // your real URL
  ],
  credentials: true,
}));

// Parse JSON request bodies automatically
// Without this, req.body would be undefined
app.use(express.json());

// Log every incoming request to the console (helpful for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});


/* ─────────────────────────────────────────────
   API ROUTES
   Each file handles a group of related endpoints
───────────────────────────────────────────── */
app.use("/api/auth",     authRoutes);    // Login, logout, me
app.use("/api/routes",   routeRoutes);   // Bus route CRUD
app.use("/api/buses",    busRoutes);     // Fleet CRUD
app.use("/api/drivers",  driverRoutes);  // Driver CRUD + schedule
app.use("/api/bookings", bookingRoutes); // Booking CRUD
app.use("/api/staff",    staffRoutes);   // Staff management


/* ─────────────────────────────────────────────
   HEALTH CHECK
   Visit http://localhost:5000/api/health to confirm server is running
───────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.json({
    status:    "OK",
    message:   "Oga Transit Backend is running 🚌",
    timestamp: new Date().toISOString(),
    version:   "1.0.0",
  });
});


/* ─────────────────────────────────────────────
   404 HANDLER
   Catches any request that didn't match a route above
───────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` });
});


/* ─────────────────────────────────────────────
   GLOBAL ERROR HANDLER
   Catches any unexpected errors thrown in route handlers
───────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});


/* ─────────────────────────────────────────────
   START THE SERVER
───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log("\n🚌 Oga Transit Backend Started!");
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`🔍 Health check:      http://localhost:${PORT}/api/health`);
  console.log("\n📋 Test Login Credentials:");
  console.log("   Super Admin  → admin@ogatransit.ng   / password");
  console.log("   Operations   → ops@ogatransit.ng     / password");
  console.log("   Finance      → finance@ogatransit.ng / password");
  console.log("   Driver       → driver1@ogatransit.ng / password");
  console.log("   User         → user@ogatransit.ng    / password");
  console.log("\n💡 All passwords are: password\n");
});
