/**
 * routes/routes.js — Bus Routes API
 *
 * GET    /api/routes/search    → smart search (no auth needed)
 * GET    /api/routes           → get all routes
 * GET    /api/routes/:id       → get one route
 * POST   /api/routes           → create a route (admin only)
 * PUT    /api/routes/:id       → update a route (admin only)
 * DELETE /api/routes/:id       → delete a route (superadmin only)
 * PATCH  /api/routes/:id/status → activate or deactivate
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "../utils/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const ADMIN_ROLES = ["superadmin", "operations"];

/* ─────────────────────────────────────────────
   SEARCH — public, no auth needed
   GET /api/routes/search?from=Lagos&to=Abuja
   Returns { exact: [...], similar: [...] }
───────────────────────────────────────────── */
router.get("/search", (req, res) => {
  const { from, to } = req.query;
  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const active = routes.filter(r => r.status === "active");

  const enrich = r => ({
    ...r,
    bus:    buses.find(b => b.id === r.busId)      || null,
    driver: drivers.find(d => d.id === r.driverId) || null,
  });

  const normFrom = (from || "").toLowerCase().trim();
  const normTo   = (to   || "").toLowerCase().trim();

  if (!normFrom && !normTo) {
    return res.json({ exact: active.map(enrich), similar: [], query: { from, to } });
  }

  // Exact: both from AND to match
  const exact = active.filter(r =>
    (!normFrom || r.from.toLowerCase().includes(normFrom)) &&
    (!normTo   || r.to.toLowerCase().includes(normTo))
  );

  // Similar: only one side matches
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
});


/* ─────────────────────────────────────────────
   GET ALL ROUTES
───────────────────────────────────────────── */
router.get("/", verifyToken, (req, res) => {
  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const enriched = routes.map(r => ({
    ...r,
    bus:    buses.find(b => b.id === r.busId)      || null,
    driver: drivers.find(d => d.id === r.driverId) || null,
  }));

  res.json(enriched);
});


/* ─────────────────────────────────────────────
   GET ONE ROUTE
───────────────────────────────────────────── */
router.get("/:id", verifyToken, (req, res) => {
  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const route = routes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ message: "Route not found." });

  res.json({
    ...route,
    bus:    buses.find(b => b.id === route.busId)      || null,
    driver: drivers.find(d => d.id === route.driverId) || null,
  });
});


/* ─────────────────────────────────────────────
   CREATE ROUTE
───────────────────────────────────────────── */
router.post("/", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const { from, to, fromTerminal, toTerminal, price, duration, departures, stops, busId, driverId, distance } = req.body;

  if (!from || !to || !price || !duration) {
    return res.status(400).json({ message: "from, to, price, and duration are required." });
  }

  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const newRouteId = `rt-${uuidv4().slice(0, 6)}`;

  const newRoute = {
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
    createdAt:    new Date().toISOString(),
  };

  routes.push(newRoute);
  writeDB("routes", routes);

  // Sync driver assignment
  if (driverId) {
    const driverIdx = drivers.findIndex(d => d.id === driverId);
    if (driverIdx !== -1) {
      drivers[driverIdx].assignedRouteId = newRouteId;
      drivers[driverIdx].assignedBusId   = busId || drivers[driverIdx].assignedBusId;
      writeDB("drivers", drivers);
    }
  }

  // Sync bus assignment
  if (busId) {
    const busIdx = buses.findIndex(b => b.id === busId);
    if (busIdx !== -1) {
      buses[busIdx].assignedRouteId  = newRouteId;
      buses[busIdx].assignedDriverId = driverId || buses[busIdx].assignedDriverId;
      writeDB("buses", buses);
    }
  }

  res.status(201).json({ message: "Route created.", route: newRoute });
});


/* ─────────────────────────────────────────────
   UPDATE ROUTE — syncs driver and bus records
───────────────────────────────────────────── */
router.put("/:id", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const index = routes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Route not found." });

  const oldRoute = routes[index];
  const newBusId    = req.body.busId    !== undefined ? req.body.busId    : oldRoute.busId;
  const newDriverId = req.body.driverId !== undefined ? req.body.driverId : oldRoute.driverId;

  // ── Unassign old driver if it changed ──
  if (oldRoute.driverId && oldRoute.driverId !== newDriverId) {
    const oldDriverIdx = drivers.findIndex(d => d.id === oldRoute.driverId);
    if (oldDriverIdx !== -1) {
      drivers[oldDriverIdx].assignedRouteId = null;
      drivers[oldDriverIdx].assignedBusId   = null;
    }
  }

  // ── Unassign old bus if it changed ──
  if (oldRoute.busId && oldRoute.busId !== newBusId) {
    const oldBusIdx = buses.findIndex(b => b.id === oldRoute.busId);
    if (oldBusIdx !== -1) {
      buses[oldBusIdx].assignedRouteId  = null;
      buses[oldBusIdx].assignedDriverId = null;
    }
  }

  // ── Assign new driver ──
  if (newDriverId) {
    const newDriverIdx = drivers.findIndex(d => d.id === newDriverId);
    if (newDriverIdx !== -1) {
      drivers[newDriverIdx].assignedRouteId = req.params.id;
      drivers[newDriverIdx].assignedBusId   = newBusId || null;
    }
  }

  // ── Assign new bus ──
  if (newBusId) {
    const newBusIdx = buses.findIndex(b => b.id === newBusId);
    if (newBusIdx !== -1) {
      buses[newBusIdx].assignedRouteId  = req.params.id;
      buses[newBusIdx].assignedDriverId = newDriverId || null;
    }
  }

  // ── Save all three collections ──
  routes[index] = { ...oldRoute, ...req.body, id: req.params.id };
  writeDB("routes",  routes);
  writeDB("drivers", drivers);
  writeDB("buses",   buses);

  res.json({ message: "Route updated.", route: routes[index] });
});


/* ─────────────────────────────────────────────
   TOGGLE STATUS
───────────────────────────────────────────── */
router.patch("/:id/status", verifyToken, requireRole(ADMIN_ROLES), (req, res) => {
  const routes = readDB("routes");
  const index  = routes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Route not found." });

  routes[index].status = routes[index].status === "active" ? "inactive" : "active";
  writeDB("routes", routes);
  res.json({ message: `Route ${routes[index].status}.`, route: routes[index] });
});


/* ─────────────────────────────────────────────
   DELETE ROUTE (superadmin only)
───────────────────────────────────────────── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const routes  = readDB("routes");
  const buses   = readDB("buses");
  const drivers = readDB("drivers");

  const route = routes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ message: "Route not found." });

  // Unassign driver and bus when route is deleted
  if (route.driverId) {
    const driverIdx = drivers.findIndex(d => d.id === route.driverId);
    if (driverIdx !== -1) {
      drivers[driverIdx].assignedRouteId = null;
      drivers[driverIdx].assignedBusId   = null;
      writeDB("drivers", drivers);
    }
  }

  if (route.busId) {
    const busIdx = buses.findIndex(b => b.id === route.busId);
    if (busIdx !== -1) {
      buses[busIdx].assignedRouteId  = null;
      buses[busIdx].assignedDriverId = null;
      writeDB("buses", buses);
    }
  }

  writeDB("routes", routes.filter(r => r.id !== req.params.id));
  res.json({ message: "Route deleted." });
});

export default router;