"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/categoryRoutes.ts
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes (or protected with auth)
router.get("/", categoryController_1.getCategories);
router.get("/:id", categoryController_1.getCategoryById);
// Protected routes (require authentication)
router.post("/", auth_1.authenticate, categoryController_1.createCategory);
router.put("/:id", auth_1.authenticate, categoryController_1.updateCategory);
router.delete("/:id", auth_1.authenticate, categoryController_1.deleteCategory);
exports.default = router;
