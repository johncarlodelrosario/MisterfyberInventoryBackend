"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const siteRoutes_1 = __importDefault(require("./routes/siteRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const installationRoutes_1 = __importDefault(require("./routes/installationRoutes"));
const budgetRoutes_1 = __importDefault(require("./routes/budgetRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ============================================================
// CORS Configuration
// ============================================================
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
    "https://misterfyberinventory.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);
// Allow Vercel preview deployments (e.g. misterfyberinventory-git-xyz.vercel.app)
const vercelPreviewRegex = /^https:\/\/misterfyberinventory[a-z0-9-]*\.vercel\.app$/;
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        if (vercelPreviewRegex.test(origin)) {
            return callback(null, true);
        }
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Handle preflight requests
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// ============================================================
// MongoDB Connection
// ============================================================
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db";
        const conn = await mongoose_1.default.connect(uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
connectDB();
// ============================================================
// API Routes
// ============================================================
app.use("/api/auth", authRoutes_1.default);
app.use("/api/sites", siteRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/inventory", inventoryRoutes_1.default);
app.use("/api/installations", installationRoutes_1.default);
app.use("/api/budget", budgetRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
// ============================================================
// Health Check
// ============================================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Inventory System API Running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        endpoints: {
            auth: "/api/auth",
            sites: "/api/sites",
            categories: "/api/categories",
            inventory: "/api/inventory",
            installations: "/api/installations",
            budget: "/api/budget",
            reports: "/api/reports",
        },
    });
});
// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
});
// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            error: err.message,
            details: err.errors,
        });
    }
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            error: "Invalid ID format",
        });
    }
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: "Duplicate key error",
            field: Object.keys(err.keyPattern)[0],
        });
    }
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            error: "Token expired",
        });
    }
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            error: "CORS policy: Origin not allowed",
        });
    }
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Something went wrong!",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});
// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log(`\n✅ Server is ready to accept requests\n`);
});
// ============================================================
// Process Error Handlers
// ============================================================
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    console.error(err.stack);
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    console.error(err.stack);
    process.exit(1);
});
