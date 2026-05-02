/**
 * routes/routes.js — Bus Routes API (MongoDB version)
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import Route from "../models/Route.js";
import Bus from "../models/Bus.js";
import Driver from "../models/Driver.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "localAdmin"];

/* ── SEARCH — public, no auth ── */
router.get("/search", async (req, res) => {
  try {
    const { from, to } = req.query;
    const normFrom = (from || "").toLowerCase().trim();
    const normTo   = (to   || "").toLowerCase().trim();

    const active = await Route.find({ status: "active" });
    const buses   = await Bus.find();
    const drivers = await Driver.find();

    const enrich = r => ({
      ...r.toObject(),
      bus:    buses.find(b => b.id === r.busId)      || null,
      driver: drivers.find(d => d.id === r.driverId) || null,
    });

    if (!normFrom && !normTo) {
      return res.json({ exact: active.map(enrich), similar: [], query: { from, to } });
    }

    const exact = active.filter(r =>
      (!normFrom || r.from.toLowerCase().includes(normFrom)) &&
      (!normTo   || r.to.toLowerCase().includes(normTo))
    );

    const exactIds = new Set(exact.map(r => r.id));
    const similar  = active.filter(r =>
      !exactIds.has(r.id) && (
        (normFrom && r.from.toLowerCase().includes(normFrom)) ||
        (normTo   && r.to.toLowerCase().includes(normTo))     ||
        (normFrom && r.to.toLowerCase().includes(normFrom))   ||
        (normTo   && r.from.toLowerCase().includes(normTo))
      )
    );

    res.json({ exact: exact.map(enrich), similar: similar.map(enrich), query: { from, to } });
  } catch (err) {
    res.status(500).json({ message: "Search failed." });
  }
});

/* ── GET ALL ROUTES ── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const routes  = await Route.find();
    const buses   = await Bus.find();
    const drivers = await Driver.find();

    const enriched = routes.map(r => ({
      ...r.toObject(),
      bus:    buses.find(b => b.id === r.busId)      || null,
      driver: drivers.find(d => d.id === r.driverId) || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch routes." });
  }
});

/* ── GET ONE ROUTE ── */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const route = await Route.findOne({ id: req.params.id });
    if (!route) return res.status(404).json({ message: "Route not found." });

    const buses   = await Bus.find();
    const drivers = await Driver.find();

    res.json({
      ...route.toObject(),
      bus:    buses.find(b => b.id === route.busId)      || null,
      driver: drivers.find(d => d.id === route.driverId) || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch route." });
  }
});

/* ── CREATE ROUTE ── */
router.post("/", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { from, to, fromTerminal, toTerminal, price, duration, departures, stops, busId, driverId, distance } = req.body;

    if (!from || !to || !price || !duration)
      return res.status(400).json({ message: "from, to, price, and duration are required." });

    const newRouteId = `rt-${uuidv4().slice(0, 6)}`;

    const newRoute = await Route.create({
      id:           newRouteId,
      from, to,
      fromTerminal: fromTerminal || "",
      toTerminal:   toTerminal   || "",
      price:        Number(price),
      duration,
      departures:   departures || [],
      stops:        stops      || [],
      distance:     distance   || "",
      busId:        busId      || null,
      driverId:     driverId   || null,
      status:       "active",
    });

    // Sync driver assignment
    if (driverId) {
      await Driver.findOneAndUpdate(
        { id: driverId },
        { assignedRouteId: newRouteId, ...(busId && { assignedBusId: busId }) }
      );
    }

    // Sync bus assignment
    if (busId) {
      await Bus.findOneAndUpdate(
        { id: busId },
        { assignedRouteId: newRouteId, ...(driverId && { assignedDriverId: driverId }) }
      );
    }

    res.status(201).json({ message: "Route created.", route: newRoute });
  } catch (err) {
    res.status(500).json({ message: "Failed to create route." });
  }
});

/* ── UPDATE ROUTE ── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const route = await Route.findOne({ id: req.params.id });
    if (!route) return res.status(404).json({ message: "Route not found." });

    const newBusId    = req.body.busId    !== undefined ? req.body.busId    : route.busId;
    const newDriverId = req.body.driverId !== undefined ? req.body.driverId : route.driverId;

    // Unassign old driver if changed
    if (route.driverId && route.driverId !== newDriverId) {
      await Driver.findOneAndUpdate({ id: route.driverId }, { assignedRouteId: null, assignedBusId: null });
    }

    // Unassign old bus if changed
    if (route.busId && route.busId !== newBusId) {
      await Bus.findOneAndUpdate({ id: route.busId }, { assignedRouteId: null, assignedDriverId: null });
    }

    // Assign new driver
    if (newDriverId) {
      await Driver.findOneAndUpdate(
        { id: newDriverId },
        { assignedRouteId: req.params.id, assignedBusId: newBusId || null }
      );
    }

    // Assign new bus
    if (newBusId) {
      await Bus.findOneAndUpdate(
        { id: newBusId },
        { assignedRouteId: req.params.id, assignedDriverId: newDriverId || null }
      );
    }

    Object.assign(route, req.body, { id: req.params.id });
    await route.save();

    res.json({ message: "Route updated.", route });
  } catch (err) {
    res.status(500).json({ message: "Failed to update route." });
  }
});

/* ── TOGGLE STATUS ── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const route = await Route.findOne({ id: req.params.id });
    if (!route) return res.status(404).json({ message: "Route not found." });

    route.status = route.status === "active" ? "inactive" : "active";
    await route.save();

    res.json({ message: `Route ${route.status}.`, route });
  } catch (err) {
    res.status(500).json({ message: "Failed to update route status." });
  }
});

/* ── DELETE ROUTE ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const route = await Route.findOne({ id: req.params.id });
    if (!route) return res.status(404).json({ message: "Route not found." });

    if (route.driverId) {
      await Driver.findOneAndUpdate({ id: route.driverId }, { assignedRouteId: null, assignedBusId: null });
    }
    if (route.busId) {
      await Bus.findOneAndUpdate({ id: route.busId }, { assignedRouteId: null, assignedDriverId: null });
    }

    await Route.deleteOne({ id: req.params.id });
    res.json({ message: "Route deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete route." });
  }
});

export default router;