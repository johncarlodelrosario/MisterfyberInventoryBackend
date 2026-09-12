"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
// Protected routes (require authentication)
router.get("/profile", auth_1.authenticate, authController_1.getProfile);
router.get("/me", auth_1.authenticate, authController_1.getMe);
router.post("/logout", auth_1.authenticate, authController_1.logout);
router.put("/profile", auth_1.authenticate, authController_1.updateProfile);
exports.default = router;
