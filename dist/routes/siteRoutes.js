"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const siteController_1 = require("../controllers/siteController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.authenticate);
// Public routes (authenticated users)
router.get("/", siteController_1.getSites);
router.get("/:id", siteController_1.getSiteById);
// Admin only routes
router.post("/", auth_1.isAdmin, siteController_1.createSite);
router.put("/:id", auth_1.isAdmin, siteController_1.updateSite);
router.delete("/:id", auth_1.isAdmin, siteController_1.deleteSite);
exports.default = router;
