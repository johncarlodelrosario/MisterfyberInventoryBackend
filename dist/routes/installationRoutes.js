"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/installations.ts
const express_1 = require("express");
const installationController_1 = require("../controllers/installationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Core installation routes - NO CACHE MIDDLEWARE for instant response
router.post("/", installationController_1.createInstallation);
router.get("/", installationController_1.getInstallations);
router.get("/daily", installationController_1.getDailyInstallations);
router.patch("/:id/status", installationController_1.updateInstallationStatus);
router.delete("/:id", installationController_1.deleteInstallation); // NEW
// Helper routes
router.get("/inventory/:inventoryId/site/:siteId", installationController_1.getSiteInventoryDetails);
router.get("/inventory/site/:siteId", installationController_1.getInventoryBySite);
router.get("/inventory/site/:siteId/value", installationController_1.getInventoryValueBySite);
exports.default = router;
