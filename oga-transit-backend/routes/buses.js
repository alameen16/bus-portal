/**
 * routes/buses.js — Buses (Fleet) API (MongoDB version)
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import Bus from "../models/Bus.js";
import Route from "../models/Route.js";
import Driver from "../models/Driver.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "localAdmin"];

/* ── GET ALL BUSES ── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const buses   = await Bus.find();
    const routes  = await Route.find();
    const drivers = await Driver.find();

    const enriched = buses.map(bus => ({
      ...bus.toObject(),
      route:  routes.find(r  => r.id === bus.assignedRouteId)  || null,
      driver: drivers.find(d => d.id === bus.assignedDriverId) || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch buses." });
  }
});

/* ── GET ONE BUS ── */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: "Bus not found." });

    const routes  = await Route.find();
    const drivers = await Driver.find();

    res.json({
      ...bus.toObject(),
      route:  routes.find(r  => r.id === bus.assignedRouteId)  || null,
      driver: drivers.find(d => d.id === bus.assignedDriverId) || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bus." });
  }
});

/* ── ADD A NEW BUS ── */
router.post("/", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { plateNumber, model, capacity, year, amenities, color } = req.body;

    if (!plateNumber || !model || !capacity)
      return res.status(400).json({ message: "plateNumber, model, and capacity are required." });

    const existing = await Bus.findOne({ plateNumber });
    if (existing)
      return res.status(409).json({ message: "A bus with this plate number already exists." });

    const newBus = await Bus.create({
      id:               `bus-${uuidv4().slice(0, 6)}`,
      plateNumber,
      model,
      capacity:         Number(capacity),
      year:             Number(year) || new Date().getFullYear(),
      status:           "active",
      assignedRouteId:  null,
      assignedDriverId: null,
      lastMaintenance:  null,
      nextMaintenance:  null,
      amenities:        amenities || [],
      color:            color || "Green/White",
    });

    res.status(201).json({ message: "Bus added successfully.", bus: newBus });
  } catch (err) {
    res.status(500).json({ message: "Failed to add bus." });
  }
});

/* ── UPDATE A BUS ── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: "Bus not found." });

    Object.assign(bus, req.body, { id: req.params.id });
    await bus.save();

    res.json({ message: "Bus updated successfully.", bus });
  } catch (err) {
    res.status(500).json({ message: "Failed to update bus." });
  }
});

/* ── CHANGE BUS STATUS ── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "maintenance", "inactive"];

    if (!validStatuses.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });

    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: "Bus not found." });

    bus.status = status;

    // Unassign from route and driver when going inactive/maintenance
    if (status === "maintenance" || status === "inactive") {
      const { assignedRouteId, assignedDriverId } = bus;

      if (assignedRouteId) {
        await Route.findOneAndUpdate({ id: assignedRouteId }, { busId: null });
      }
      if (assignedDriverId) {
        await Driver.findOneAndUpdate({ id: assignedDriverId }, { assignedBusId: null });
      }

      bus.assignedRouteId  = null;
      bus.assignedDriverId = null;
    }

    await bus.save();
    res.json({ message: `Bus status updated to "${status}".`, bus });
  } catch (err) {
    res.status(500).json({ message: "Failed to update bus status." });
  }
});

/* ── DELETE A BUS ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const bus = await Bus.findOne({ id: req.params.id });
    if (!bus) return res.status(404).json({ message: "Bus not found." });

    if (bus.assignedRouteId) {
      await Route.findOneAndUpdate({ id: bus.assignedRouteId }, { busId: null });
    }
    if (bus.assignedDriverId) {
      await Driver.findOneAndUpdate({ id: bus.assignedDriverId }, { assignedBusId: null });
    }

    await Bus.deleteOne({ id: req.params.id });
    res.json({ message: "Bus removed from fleet." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete bus." });
  }
});

export default router;