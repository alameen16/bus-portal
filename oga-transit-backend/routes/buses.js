/**
 * routes/buses.js — Buses (Fleet) API
 *
 * GET    /api/buses           → get all buses
 * GET    /api/buses/:id       → get one bus
 * POST   /api/buses           → add a new bus
 * PUT    /api/buses/:id       → update bus details
 * DELETE /api/buses/:id       → remove a bus (superadmin only)
 * PATCH  /api/buses/:id/status → change status (active/maintenance/inactive)
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "../utils/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "operations"];


/* ── GET ALL BUSES ── */
router.get("/", verifyToken, (req, res) => {
  const buses   = readDB("buses");
  const routes  = readDB("routes");
  const drivers = readDB("drivers");

  const enriched = buses.map(bus => ({
    ...bus,
    route:  routes.find(r  => r.id === bus.assignedRouteId)  || null,
    driver: drivers.find(d => d.id === bus.assignedDriverId) || null,
  }));

  res.json(enriched);
});


/* ── GET ONE BUS ── */
router.get("/:id", verifyToken, (req, res) => {
  const buses   = readDB("buses");
  const routes  = readDB("routes");
  const drivers = readDB("drivers");

  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found." });

  res.json({
    ...bus,
    route:  routes.find(r  => r.id === bus.assignedRouteId)  || null,
    driver: drivers.find(d => d.id === bus.assignedDriverId) || null,
  });
});


/* ── ADD A NEW BUS ── */
router.post("/", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const { plateNumber, model, capacity, year, amenities, color } = req.body;

  if (!plateNumber || !model || !capacity) {
    return res.status(400).json({ message: "plateNumber, model, and capacity are required." });
  }

  const buses = readDB("buses");

  if (buses.find(b => b.plateNumber === plateNumber)) {
    return res.status(409).json({ message: "A bus with this plate number already exists." });
  }

  const newBus = {
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
    createdAt:        new Date().toISOString(),
  };

  buses.push(newBus);
  writeDB("buses", buses);

  res.status(201).json({ message: "Bus added successfully.", bus: newBus });
});


/* ── UPDATE A BUS ── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const buses = readDB("buses");
  const index = buses.findIndex(b => b.id === req.params.id);

  if (index === -1) return res.status(404).json({ message: "Bus not found." });

  buses[index] = { ...buses[index], ...req.body, id: req.params.id };
  writeDB("buses", buses);

  res.json({ message: "Bus updated successfully.", bus: buses[index] });
});


/* ── CHANGE BUS STATUS ── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const { status } = req.body;
  const validStatuses = ["active", "maintenance", "inactive"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  const buses   = readDB("buses");
  const routes  = readDB("routes");
  const drivers = readDB("drivers");

  const index = buses.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Bus not found." });

  buses[index].status = status;

  // When going into maintenance or inactive, unassign from route and driver
  if (status === "maintenance" || status === "inactive") {
    const { assignedRouteId, assignedDriverId } = buses[index];

    // Clear the bus side
    buses[index].assignedRouteId  = null;
    buses[index].assignedDriverId = null;

    // Clear the route's busId
    if (assignedRouteId) {
      const routeIdx = routes.findIndex(r => r.id === assignedRouteId);
      if (routeIdx !== -1) {
        routes[routeIdx].busId = null;
        writeDB("routes", routes);
      }
    }

    // Clear the driver's assignedBusId
    if (assignedDriverId) {
      const driverIdx = drivers.findIndex(d => d.id === assignedDriverId);
      if (driverIdx !== -1) {
        drivers[driverIdx].assignedBusId = null;
        writeDB("drivers", drivers);
      }
    }
  }

  writeDB("buses", buses);
  res.json({ message: `Bus status updated to "${status}".`, bus: buses[index] });
});


/* ── DELETE A BUS ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const buses   = readDB("buses");
  const routes  = readDB("routes");
  const drivers = readDB("drivers");

  const bus = buses.find(b => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found." });

  // Unassign from route and driver before deleting
  if (bus.assignedRouteId) {
    const routeIdx = routes.findIndex(r => r.id === bus.assignedRouteId);
    if (routeIdx !== -1) {
      routes[routeIdx].busId = null;
      writeDB("routes", routes);
    }
  }

  if (bus.assignedDriverId) {
    const driverIdx = drivers.findIndex(d => d.id === bus.assignedDriverId);
    if (driverIdx !== -1) {
      drivers[driverIdx].assignedBusId = null;
      writeDB("drivers", drivers);
    }
  }

  writeDB("buses", buses.filter(b => b.id !== req.params.id));
  res.json({ message: "Bus removed from fleet." });
});

export default router;