"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header("Authorization");
        console.log("Auth header present:", !!authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: "No token provided",
            });
        }
        const token = authHeader.replace("Bearer ", "");
        console.log("Token received, verifying...");
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        console.log("Token decoded:", decoded);
        // Find user by id
        const user = await User_1.default.findById(decoded.userId || decoded.id).select("-password");
        console.log("User found:", user ? "Yes" : "No");
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "User not found",
            });
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error.message);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                error: "Invalid token",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "Token expired",
            });
        }
        res.status(401).json({
            success: false,
            error: "Authentication failed",
        });
    }
};
exports.authenticate = authenticate;
const isAdmin = async (req, res, next) => {
    try {
        console.log("Checking admin role for user:", req.user?.username);
        console.log("User role:", req.user?.role);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: "Admin access required",
            });
        }
        next();
    }
    catch (error) {
        console.error("Admin check error:", error);
        res.status(500).json({
            success: false,
            error: "Error checking admin status",
        });
    }
};
exports.isAdmin = isAdmin;
