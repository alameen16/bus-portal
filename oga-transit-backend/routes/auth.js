/**
 * routes/auth.js — Login / Logout / Me / Change Password (MongoDB version)
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { verifyToken, JWT_SECRET } from "../middleware/auth.js";

const router = Router();

/* ── LOGIN ── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email/phone and password are required." });

    // Find by email OR phone
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: email.trim() },
      ],
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email/phone or password." });

    if (user.status === "suspended")
      return res.status(403).json({ message: "Your account has been suspended. Contact admin." });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid email/phone or password." });

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
  } catch (err) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

/* ── ME ── */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      phone:  user.phone,
      avatar: user.avatar,
      status: user.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user." });
  }
});

/* ── LOGOUT ── */
router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logged out successfully." });
});

/* ── CHANGE PASSWORD ── */
router.patch("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new password are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    if (confirmPassword && newPassword !== confirmPassword)
      return res.status(400).json({ message: "New passwords do not match." });

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Current password is incorrect." });

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      return res.status(400).json({ message: "New password must be different from current password." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password." });
  }
});

export default router;