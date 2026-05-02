/**
 * routes/drivers.js — Drivers API (MongoDB version)
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import Driver from "../models/Driver.js";
import User from "../models/User.js";
import Bus from "../models/Bus.js";
import Route from "../models/Route.js";
import Booking from "../models/Booking.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "localAdmin"];

/* ── GET ALL DRIVERS ── */
router.get("/", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const drivers = await Driver.find();
    const buses   = await Bus.find();
    const routes  = await Route.find();

    const enriched = drivers.map(driver => ({
      ...driver.toObject(),
      bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
      route: routes.find(r => r.id === driver.assignedRouteId) || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch drivers." });
  }
});

/* ── GET MY DRIVER PROFILE ── */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const driver = await Driver.findOne({
      $or: [{ userId: req.user.id }, { email: req.user.email }],
    });

    if (!driver)
      return res.status(404).json({ message: "No driver profile found for your account. Contact admin." });

    const buses  = await Bus.find();
    const routes = await Route.find();

    res.json({
      ...driver.toObject(),
      bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
      route: routes.find(r => r.id === driver.assignedRouteId) || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch driver profile." });
  }
});

/* ── GET ONE DRIVER ── */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    if (req.user.role === "driver" && driver.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied." });

    const buses  = await Bus.find();
    const routes = await Route.find();

    res.json({
      ...driver.toObject(),
      bus:   buses.find(b  => b.id === driver.assignedBusId)   || null,
      route: routes.find(r => r.id === driver.assignedRouteId) || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch driver." });
  }
});

/* ── GET DRIVER SCHEDULE ── */
router.get("/:id/schedule", verifyToken, async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    if (req.user.role === "driver" && driver.userId !== req.user.id)
      return res.status(403).json({ message: "Access denied." });

    const assignedRoute = driver.assignedRouteId
      ? await Route.findOne({ id: driver.assignedRouteId })
      : null;
    const assignedBus = driver.assignedBusId
      ? await Bus.findOne({ id: driver.assignedBusId })
      : null;

    const today = new Date().toISOString().split("T")[0];

    const todayBookings = await Booking.find({
      routeId: driver.assignedRouteId,
      date:    today,
      status:  "confirmed",
    });

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
      todayDate:            today,
      schedule,
      totalPassengersToday: todayBookings.length,
      totalTripsToday:      schedule.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch schedule." });
  }
});

/* ── ADD A DRIVER ── */
router.post("/", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, licenseExpiry, emergencyContact, password } = req.body;

    if (!name || !email || !phone || !licenseNumber || !password)
      return res.status(400).json({ message: "name, email, phone, licenseNumber, and password are required." });

    const existingDriver = await Driver.findOne({ licenseNumber });
    if (existingDriver)
      return res.status(409).json({ message: "A driver with this license number already exists." });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser)
      return res.status(409).json({ message: "A user with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = `u-${uuidv4().slice(0, 6)}`;
    const avatar = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    // Create user login account
    await User.create({
      id:       newUserId,
      name,
      email:    email.toLowerCase(),
      password: hashedPassword,
      role:     "driver",
      phone:    phone || "",
      avatar,
      status:   "active",
    });

    // Create driver profile
    const newDriver = await Driver.create({
      id:               `drv-${uuidv4().slice(0, 6)}`,
      userId:           newUserId,
      name,
      email:            email.toLowerCase(),
      phone,
      licenseNumber,
      licenseExpiry:    licenseExpiry    || null,
      assignedBusId:    null,
      assignedRouteId:  null,
      status:           "off-duty",
      rating:           0,
      totalTrips:       0,
      joinDate:         new Date().toISOString().split("T")[0],
      avatar,
      emergencyContact: emergencyContact || "",
    });

    res.status(201).json({
      message: "Driver added successfully. Login account created.",
      driver: newDriver,
      login: { email, temporaryPassword: password },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add driver." });
  }
});

/* ── UPDATE A DRIVER ── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    // Sync name/phone/email to linked user account
    if (driver.userId) {
      const updates = {};
      if (req.body.name)  updates.name  = req.body.name;
      if (req.body.email) updates.email = req.body.email.toLowerCase();
      if (req.body.phone) updates.phone = req.body.phone;
      if (Object.keys(updates).length > 0) {
        await User.findOneAndUpdate({ id: driver.userId }, updates);
      }
    }

    Object.assign(driver, req.body, { id: req.params.id });
    await driver.save();

    res.json({ message: "Driver updated.", driver });
  } catch (err) {
    res.status(500).json({ message: "Failed to update driver." });
  }
});

/* ── CHANGE DRIVER STATUS ── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["on-duty", "off-duty", "suspended"];

    if (!validStatuses.includes(status))
      return res.status(400).json({ message: `Status must be: ${validStatuses.join(", ")}` });

    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    driver.status = status;
    await driver.save();

    // Sync suspension/reactivation to login account
    if (driver.userId) {
      if (status === "suspended") {
        await User.findOneAndUpdate({ id: driver.userId }, { status: "suspended" });
      } else {
        const user = await User.findOne({ id: driver.userId });
        if (user?.status === "suspended") {
          await User.findOneAndUpdate({ id: driver.userId }, { status: "active" });
        }
      }
    }

    res.json({ message: `Driver status updated to "${status}".`, driver });
  } catch (err) {
    res.status(500).json({ message: "Failed to update driver status." });
  }
});

/* ── DELETE A DRIVER ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const driver = await Driver.findOne({ id: req.params.id });
    if (!driver) return res.status(404).json({ message: "Driver not found." });

    if (driver.userId) {
      await User.deleteOne({ id: driver.userId });
    }

    await Driver.deleteOne({ id: req.params.id });
    res.json({ message: "Driver and login account removed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete driver." });
  }
});

export default router;