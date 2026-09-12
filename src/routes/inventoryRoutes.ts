// routes/inventoryRoutes.ts
import { Router } from "express";
import {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  deductInventory,
} from "../controllers/inventoryController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", isAdmin, createInventory);
router.get("/", getInventory); // REMOVED cacheMiddleware
router.get("/:id", getInventoryById);
router.put("/:id", isAdmin, updateInventory);
router.delete("/:id", isAdmin, deleteInventory);
router.post("/:id/deduct", isAdmin, deductInventory);

export default router;
