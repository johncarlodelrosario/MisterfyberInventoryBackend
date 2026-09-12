"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/inventoryRoutes.ts
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post("/", auth_1.isAdmin, inventoryController_1.createInventory);
router.get("/", inventoryController_1.getInventory); // REMOVED cacheMiddleware
router.get("/:id", inventoryController_1.getInventoryById);
router.put("/:id", auth_1.isAdmin, inventoryController_1.updateInventory);
router.delete("/:id", auth_1.isAdmin, inventoryController_1.deleteInventory);
router.post("/:id/deduct", auth_1.isAdmin, inventoryController_1.deductInventory);
exports.default = router;
