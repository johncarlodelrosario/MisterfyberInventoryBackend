import { Router } from "express";
import {
  register,
  login,
  getProfile,
  getMe,
  logout,
  updateProfile,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.put("/profile", authenticate, updateProfile);

export default router;
