import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import siteRoutes from "./routes/siteRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import installationRoutes from "./routes/installationRoutes";
import budgetRoutes from "./routes/budgetRoutes";
import reportRoutes from "./routes/reportRoutes";
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// ============================================================
// CORS Configuration
// ============================================================
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://misterfyberinventory.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// ============================================================
// MongoDB Connection
// ============================================================
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db";
        const conn = await mongoose.connect(uri);
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
app.use("/api/auth", authRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/installations", installationRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/reports", reportRoutes);
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
//# sourceMappingURL=index.js.map