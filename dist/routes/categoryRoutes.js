// src/routes/categoryRoutes.ts
import { Router } from "express";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, } from "../controllers/categoryController";
import { authenticate } from "../middleware/auth";
const router = Router();
// Public routes (or protected with auth)
router.get("/", getCategories);
router.get("/:id", getCategoryById);
// Protected routes (require authentication)
router.post("/", authenticate, createCategory);
router.put("/:id", authenticate, updateCategory);
router.delete("/:id", authenticate, deleteCategory);
export default router;
