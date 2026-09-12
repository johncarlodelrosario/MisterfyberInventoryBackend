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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db");
        console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
// Connect to MongoDB
connectDB();
// Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/sites", siteRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/inventory", inventoryRoutes_1.default);
app.use("/api/installations", installationRoutes_1.default);
app.use("/api/budget", budgetRoutes_1.default);
app.use("/api/reports", reportRoutes_1.default);
// Health check
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
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    // Handle specific error types
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
    // JWT errors
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
    // Send appropriate error response
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Something went wrong!",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`🔗 Sites API: http://localhost:${PORT}/api/sites`);
    console.log(`🔗 Categories API: http://localhost:${PORT}/api/categories`);
    console.log(`🔗 Inventory API: http://localhost:${PORT}/api/inventory`);
    console.log(`🔗 Installations API: http://localhost:${PORT}/api/installations`);
    console.log(`🔗 Budget API: http://localhost:${PORT}/api/budget`);
    console.log(`🔗 Reports API: http://localhost:${PORT}/api/reports`);
    console.log(`\n✅ Server is ready to accept requests\n`);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    // Close server & exit process
    process.exit(1);
});
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    // Close server & exit process
    process.exit(1);
});
