/**
 * routes/staff.js — Staff (Admin Users) Management API
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { readDB, writeDB } from "../utils/db.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

const VALID_ROLES = ["superadmin", "localAdmin", "staff", "driver"];


/* ── GET ALL STAFF ── */
router.get("/", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const users = readDB("users");
  const staff = users
    .filter(u => ["superadmin", "localAdmin", "staff"].includes(u.role))
    .map(({ password, ...u }) => u);
  res.json(staff);
});


/* ── ADD NEW STAFF MEMBER ── */
router.post("/", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  if (!name?.trim())     return res.status(400).json({ message: "Full name is required." });
  if (!email?.trim())    return res.status(400).json({ message: "Email address is required." });
  if (!role)             return res.status(400).json({ message: "Role is required." });
  if (!password?.trim()) return res.status(400).json({ message: "Password is required." });

  const changeableRoles = ["superadmin", "localAdmin", "staff"];
  if (!changeableRoles.includes(role)) {
    return res.status(400).json({ message: `Role must be: ${changeableRoles.join(", ")}` });
  }

  const users = readDB("users");

  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (exists) {
    return res.status(409).json({ message: `Email "${email}" is already registered. Use a different email.` });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newStaff = {
    id:        `u-${uuidv4().slice(0, 6)}`,
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    password:  hashedPassword,
    role,
    phone:     phone?.trim() || "",
    avatar:    name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    status:    "active",
    createdAt: new Date().toISOString(),
  };

  users.push(newStaff);
  writeDB("users", users);

  const { password: _, ...staffWithoutPassword } = newStaff;
  res.status(201).json({ message: "Staff member added successfully.", staff: staffWithoutPassword });
});


/* ── UPDATE STAFF DETAILS ── */
router.put("/:id", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const users = readDB("users");
  const index = users.findIndex(u => u.id === req.params.id);

  if (index === -1) return res.status(404).json({ message: "Staff member not found." });

  const { password, ...updates } = req.body;
  users[index] = { ...users[index], ...updates, id: req.params.id };
  writeDB("users", users);

  const { password: _, ...result } = users[index];
  res.json({ message: "Staff updated.", staff: result });
});


/* ── CHANGE ROLE ── */
router.patch("/:id/role", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const { role } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}` });
  }

  const users = readDB("users");
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Staff not found." });

  // Prevent removing the last superadmin
  if (users[index].role === "superadmin" && role !== "superadmin") {
    const superadmins = users.filter(u => u.role === "superadmin");
    if (superadmins.length === 1) {
      return res.status(400).json({ message: "Cannot demote the only superadmin." });
    }
  }

  users[index].role = role;
  writeDB("users", users);

  res.json({ message: `Role updated to "${role}".` });
});


/* ── SUSPEND / ACTIVATE ── */
router.patch("/:id/status", verifyToken, requireRole(["superadmin"]), (req, res) => {
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({ message: "Status must be 'active' or 'suspended'." });
  }

  const users = readDB("users");
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Staff not found." });

  if (users[index].id === req.user.id) {
    return res.status(400).json({ message: "You cannot suspend your own account." });
  }

  users[index].status = status;
  writeDB("users", users);

  res.json({ message: `Account ${status === "active" ? "activated" : "suspended"}.` });
});


/* ── DELETE STAFF ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  const users  = readDB("users");
  const target = users.find(u => u.id === req.params.id);

  if (!target) {
    return res.status(404).json({ message: "Staff not found." });
  }

  // Prevent deleting the last superadmin
  if (target.role === "superadmin") {
    const superadmins = users.filter(u => u.role === "superadmin");
    if (superadmins.length === 1) {
      return res.status(400).json({ message: "Cannot delete the only superadmin. Assign another superadmin first." });
    }
  }

  writeDB("users", users.filter(u => u.id !== req.params.id));
  res.json({ message: "Staff member removed." });
});

export default router;