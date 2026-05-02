/**
 * routes/staff.js — Staff Management API (MongoDB version)
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();
const VALID_ROLES = ["superadmin", "localAdmin", "staff", "driver"];

/* ── GET ALL STAFF ── */
router.get("/", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const staff = await User.find(
      { role: { $in: ["superadmin", "localAdmin", "staff"] } },
      { password: 0 }
    );
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff." });
  }
});

/* ── ADD NEW STAFF MEMBER ── */
router.post("/", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;

    if (!name?.trim())     return res.status(400).json({ message: "Full name is required." });
    if (!email?.trim())    return res.status(400).json({ message: "Email address is required." });
    if (!role)             return res.status(400).json({ message: "Role is required." });
    if (!password?.trim()) return res.status(400).json({ message: "Password is required." });

    const changeableRoles = ["superadmin", "localAdmin", "staff"];
    if (!changeableRoles.includes(role))
      return res.status(400).json({ message: `Role must be: ${changeableRoles.join(", ")}` });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ message: `Email "${email}" is already registered.` });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await User.create({
      id:       `u-${uuidv4().slice(0, 6)}`,
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone:    phone?.trim() || "",
      avatar:   name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      status:   "active",
    });

    const { password: _, ...staffWithoutPassword } = newStaff.toObject();
    res.status(201).json({ message: "Staff member added successfully.", staff: staffWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: "Failed to add staff member." });
  }
});

/* ── UPDATE STAFF DETAILS ── */
router.put("/:id", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: "Staff member not found." });

    const { password, ...updates } = req.body;

    if (password?.trim()) {
      if (password.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      updates.password = await bcrypt.hash(password, 10);
    }

    Object.assign(user, updates, { id: req.params.id });
    await user.save();

    const result = user.toObject();
    delete result.password;
    res.json({ message: "Staff updated.", staff: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to update staff." });
  }
});

/* ── CHANGE ROLE ── */
router.patch("/:id/role", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const { role } = req.body;

    if (!VALID_ROLES.includes(role))
      return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}` });

    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: "Staff not found." });

    // Prevent removing the last superadmin
    if (user.role === "superadmin" && role !== "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount === 1)
        return res.status(400).json({ message: "Cannot demote the only superadmin." });
    }

    user.role = role;
    await user.save();

    res.json({ message: `Role updated to "${role}".` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update role." });
  }
});

/* ── SUSPEND / ACTIVATE ── */
router.patch("/:id/status", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status))
      return res.status(400).json({ message: "Status must be 'active' or 'suspended'." });

    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: "Staff not found." });

    if (user.id === req.user.id)
      return res.status(400).json({ message: "You cannot suspend your own account." });

    user.status = status;
    await user.save();

    res.json({ message: `Account ${status === "active" ? "activated" : "suspended"}.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status." });
  }
});

/* ── DELETE STAFF ── */
router.delete("/:id", verifyToken, requireRole(["superadmin"]), async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: "You cannot delete your own account." });

    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: "Staff not found." });

    if (user.role === "superadmin") {
      const superadminCount = await User.countDocuments({ role: "superadmin" });
      if (superadminCount === 1)
        return res.status(400).json({ message: "Cannot delete the only superadmin." });
    }

    await User.deleteOne({ id: req.params.id });
    res.json({ message: "Staff member removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete staff member." });
  }
});

export default router;