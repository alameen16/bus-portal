/**
 * routes/drivers.js — Drivers API
 *
 * GET    /api/drivers              → all drivers (admin)
 * GET    /api/drivers/me           → logged-in driver's own profile
 * GET    /api/drivers/:id          → one driver
 * GET    /api/drivers/:id/schedule → driver's schedule for today (driver portal)
 * POST   /api/drivers              → add a driver + auto-creates login account
 * PUT    /api/drivers/:id          → update driver
 * DELETE /api/drivers/:id          → remove driver (superadmin)
 * PATCH  /api/drivers/:id/status   → on-duty / off-duty / suspended
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "../utils/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "operations"];


/* ── GET ALL DRIVERS ── */
router.get("/", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const drivers = readDB("drivers");
  const buses   = readDB("buses");
  const routes  = readDB("routes");

  const enriched = drivers.map(driver => ({
    ...driver,
    bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
    route: routes.find(r => r.id === driver.assignedRouteId) || null,
  }));

  res.json(enriched);
});


/* ── GET MY DRIVER PROFILE (for logged-in driver) ── */
// Must be defined BEFORE /:id so Express doesn't treat "me" as an ID
router.get("/me", verifyToken, (req, res) => {
  const drivers = readDB("drivers");
  const driver  = drivers.find(d => d.userId === req.user.id || d.email === req.user.email);

  if (!driver) {
    return res.status(404).json({ message: "No driver profile found for your account. Contact admin." });
  }

  const buses  = readDB("buses");
  const routes = readDB("routes");

  res.json({
    ...driver,
    bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
    route: routes.find(r => r.id === driver.assignedRouteId) || null,
  });
});


/* ── GET ONE DRIVER ── */
router.get("/:id", verifyToken, (req, res) => {
  const drivers = readDB("drivers");
  const buses   = readDB("buses");
  const routes  = readDB("routes");

  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found." });

  // Drivers can only view their own profile
  if (req.user.role === "driver" && driver.userId !== req.user.id) {
    return res.status(403).json({ message: "Access denied." });
  }

  res.json({
    ...driver,
    bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
    route: routes.find(r => r.id === driver.assignedRouteId) || null,
  });
});


/* ── GET DRIVER SCHEDULE (used by the Driver Portal) ──
   Returns today's trips, route details, bus info,
   and passenger count for this driver
*/
router.get("/:id/schedule", verifyToken, (req, res) => {
  const drivers  = readDB("drivers");
  const buses    = readDB("buses");
  const routes   = readDB("routes");
  const bookings = readDB("bookings");

  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found." });

  // Security: drivers can only see their own schedule
  if (req.user.role === "driver" && driver.userId !== req.user.id) {
    return res.status(403).json({ message: "Access denied." });
  }

  const assignedRoute = routes.find(r => r.id === driver.assignedRouteId) || null;
  const assignedBus   = buses.find(b  => b.id === driver.assignedBusId)   || null;

  // Get today's date string (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Get today's bookings for this route
  const todayBookings = bookings.filter(b =>
    b.routeId === driver.assignedRouteId &&
    b.date    === today &&
    b.status  === "confirmed"
  );

  // Build a schedule from the route's departure times
  const schedule = assignedRoute
    ? assignedRoute.departures.map(time => ({
        time,
        passengers: todayBookings.filter(b => b.departure === time).length,
        capacity:   assignedBus?.capacity || 45,
      }))
    : [];

  res.json({
    driver,
    assignedRoute,
    assignedBus,
    todayDate: today,
    schedule,
    totalPassengersToday: todayBookings.length,
    totalTripsToday: schedule.length,
  });
});


/* ── ADD A DRIVER ──
   Also auto-creates a user login account for the driver.
   Required body fields: name, email, phone, licenseNumber, password
*/
router.post("/", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  const {
    name, email, phone, licenseNumber,
    licenseExpiry, emergencyContact, password
  } = req.body;

  if (!name || !email || !phone || !licenseNumber || !password) {
    return res.status(400).json({
      message: "name, email, phone, licenseNumber, and password are required."
    });
  }

  const drivers = readDB("drivers");
  const users   = readDB("users");

  // Check for duplicate license
  if (drivers.find(d => d.licenseNumber === licenseNumber)) {
    return res.status(409).json({ message: "A driver with this license number already exists." });
  }

  // Check for duplicate email across all users
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "A user with this email already exists." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user login account
  const newUserId = `u-${uuidv4().slice(0, 6)}`;
  const newUser = {
    id:        newUserId,
    name,
    email,
    password:  hashedPassword,
    role:      "driver",
    phone:     phone || "",
    avatar:    name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    status:    "active",
    createdAt: new Date().toISOString(),
  };

  // Create the driver profile, linked to the new user account
  const newDriver = {
    id:               `drv-${uuidv4().slice(0, 6)}`,
    userId:           newUserId,   // linked to login account
    name,
    email,
    phone,
    licenseNumber,
    licenseExpiry:    licenseExpiry    || null,
    assignedBusId:    null,
    assignedRouteId:  null,
    status:           "off-duty",
    rating:           0,
    totalTrips:       0,
    joinDate:         new Date().toISOString().split("T")[0],
    avatar:           name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    emergencyContact: emergencyContact || "",
    createdAt:        new Date().toISOString(),
  };

  // Save both
  users.push(newUser);
  drivers.push(newDriver);
  writeDB("users",   users);
  writeDB("drivers", drivers);

  res.status(201).json({
    message: "Driver added successfully. Login account created.",
    driver: newDriver,
    login: {
      email,
      // Return the plain password once so admin can share it with the driver
      // In production you'd send this via email instead
      temporaryPassword: password,
    },
  });
});


/* ── UPDATE A DRIVER ── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const drivers = readDB("drivers");
  const index   = drivers.findIndex(d => d.id === req.params.id);

  if (index === -1) return res.status(404).json({ message: "Driver not found." });

  // Also sync name/phone/email update to the linked user account
  const users     = readDB("users");
  const userIndex = users.findIndex(u => u.id === drivers[index].userId);
  if (userIndex !== -1) {
    if (req.body.name)  users[userIndex].name  = req.body.name;
    if (req.body.email) users[userIndex].email = req.body.email;
    if (req.body.phone) users[userIndex].phone = req.body.phone;
    writeDB("users", users);
  }

  drivers[index] = { ...drivers[index], ...req.body, id: req.params.id };
  writeDB("drivers", drivers);

  res.json({ message: "Driver updated.", driver: drivers[index] });
});


/* ── CHANGE DRIVER STATUS ── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const { status } = req.body;
  const validStatuses = ["on-duty", "off-duty", "suspended"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be: ${validStatuses.join(", ")}` });
  }

  const drivers = readDB("drivers");
  const index   = drivers.findIndex(d => d.id === req.params.id);

  if (index === -1) return res.status(404).json({ message: "Driver not found." });

  drivers[index].status = status;

  // Sync suspension/reactivation to the login account
  const users     = readDB("users");
  const userIndex = users.findIndex(u => u.id === drivers[index].userId);
  if (userIndex !== -1) {
    if (status === "suspended") {
      users[userIndex].status = "suspended";
    } else if (users[userIndex].status === "suspended") {
      // Only reactivate if they were suspended — don't override other states
      users[userIndex].status = "active";
    }
    writeDB("users", users);
  }

  writeDB("drivers", drivers);
  res.json({ message: `Driver status updated to "${status}".`, driver: drivers[index] });
});


/* ── DELETE A DRIVER ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const drivers = readDB("drivers");
  const driver  = drivers.find(d => d.id === req.params.id);

  if (!driver) return res.status(404).json({ message: "Driver not found." });

  // Also delete the linked user login account
  if (driver.userId) {
    const users = readDB("users");
    writeDB("users", users.filter(u => u.id !== driver.userId));
  }

  writeDB("drivers", drivers.filter(d => d.id !== req.params.id));
  res.json({ message: "Driver and login account removed successfully." });
});

export default router;