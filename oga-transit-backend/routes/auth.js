/**
 * routes/auth.js — Login / Logout / Me
 *
 * Roles after login redirect:
 *   superadmin → Admin Dashboard
 *   localAdmin → Admin Dashboard
 *   staff      → Public site (book tickets)
 *   driver     → Driver Portal
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readDB } from "../utils/db.js";
import { verifyToken, JWT_SECRET } from "../middleware/auth.js";

const router = Router();

/* ── LOGIN ── */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const users = readDB("users");
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) return res.status(401).json({ message: "Invalid email or password." });

  if (user.status === "suspended") {
    return res.status(403).json({ message: "Your account has been suspended. Contact admin." });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: "Invalid email or password." });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    message: "Login successful.",
    token,
    user: {
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      phone:  user.phone,
      avatar: user.avatar,
      status: user.status,
    },
  });
});

/* ── ME ── */
router.get("/me", verifyToken, (req, res) => {
  const users = readDB("users");
  const user  = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  const { password, ...safe } = user;
  res.json(safe);
});

/* ── LOGOUT ── */
router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logged out successfully." });
});

export default router;