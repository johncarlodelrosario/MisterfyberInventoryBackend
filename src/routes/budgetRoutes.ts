import { Router } from "express";
import {
  createOrUpdateBudget,
  getBudget,
  addTransaction,
} from "../controllers/budgetController";
import { authenticate, isAdmin } from "../middleware/auth";
import { cacheMiddleware } from "../middleware/cache";

const router = Router();

router.use(authenticate);

router.post("/", isAdmin, createOrUpdateBudget);
router.get("/", cacheMiddleware(300), getBudget);
router.post("/transaction", isAdmin, addTransaction);

export default router;
