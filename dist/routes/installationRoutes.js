// routes/installations.ts
import { Router } from "express";
import { createInstallation, getInstallations, updateInstallationStatus, deleteInstallation, getDailyInstallations, getSiteInventoryDetails, getInventoryBySite, getInventoryValueBySite, } from "../controllers/installationController";
import { authenticate } from "../middleware/auth";
const router = Router();
router.use(authenticate);
// Core installation routes - NO CACHE MIDDLEWARE for instant response
router.post("/", createInstallation);
router.get("/", getInstallations);
router.get("/daily", getDailyInstallations);
router.patch("/:id/status", updateInstallationStatus);
router.delete("/:id", deleteInstallation); // NEW
// Helper routes
router.get("/inventory/:inventoryId/site/:siteId", getSiteInventoryDetails);
router.get("/inventory/site/:siteId", getInventoryBySite);
router.get("/inventory/site/:siteId/value", getInventoryValueBySite);
export default router;
//# sourceMappingURL=installationRoutes.js.map