import { Router } from "express";
import {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
} from "../controllers/siteController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Public routes (authenticated users)
router.get("/", getSites);
router.get("/:id", getSiteById);

// Admin only routes
router.post("/", isAdmin, createSite);
router.put("/:id", isAdmin, updateSite);
router.delete("/:id", isAdmin, deleteSite);

export default router;
