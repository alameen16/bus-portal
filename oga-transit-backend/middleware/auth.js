/**
 * middleware/auth.js — Authentication & Authorization
 *
 * Final Role System:
 *   superadmin — full admin portal access (everything)
 *   localAdmin — admin portal (routes, buses, drivers, bookings — no staff/revenue)
 *   staff      — public site only (book tickets, view own bookings). NO admin portal.
 *   driver     — driver portal only
 *
 * NOTE: "user" role is removed. "staff" is the new public-facing role.
 */

import jwt from "jsonwebtoken";

export const JWT_SECRET = "oga-transit-secret-key-2025";

// Who can access the admin portal
export const ADMIN_ROLES = ["superadmin", "localAdmin"];

// Who can manage operations (routes, buses, drivers, bookings)
export const OPS_ROLES   = ["superadmin", "localAdmin"];

// Revenue + staff management — superadmin only
export const SUPER_ONLY  = ["superadmin"];

/* ── Verify JWT token ── */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

/* ── Require specific roles ── */
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Required: ${roles.join(" or ")}.` });
    }
    next();
  };
}