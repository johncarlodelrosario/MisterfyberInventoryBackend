"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.logout = exports.getMe = exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        console.log("Registration request body:", req.body);
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "Username, email, and password are required",
            });
        }
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Username or email already exists",
            });
        }
        // ⚠️ DO NOT hash here. The User model's pre('save') hook hashes it ONCE.
        const user = new User_1.default({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password, // plain password — model hashes it
            role: role || "user",
        });
        await user.save();
        console.log("User created successfully:", user.username);
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                error: error.message,
                details: error.errors,
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Username or email already exists",
                field: Object.keys(error.keyPattern)[0],
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || "Registration failed",
        });
    }
};
exports.register = register;
// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        console.log("Login request body:", req.body);
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "Username and password are required",
            });
        }
        // Must .select("+password") — password has select:false in schema
        const user = await User_1.default.findOne({
            $or: [{ username }, { email: username }],
        }).select("+password");
        if (!user) {
            console.log("User not found:", username);
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        console.log("User found:", user.username);
        console.log("Stored password length:", user.password?.length);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("Invalid password for user:", user.username);
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        console.log("Login successful for user:", user.username);
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Login failed",
        });
    }
};
exports.login = login;
// ─────────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await User_1.default.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to get profile",
        });
    }
};
exports.getProfile = getProfile;
// ─────────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await User_1.default.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to get user",
        });
    }
};
exports.getMe = getMe;
// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
const logout = async (_req, res) => {
    try {
        res.json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Logout failed",
        });
    }
};
exports.logout = logout;
// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { username, email, password } = req.body;
        const user = await User_1.default.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        if (username) {
            const existingUser = await User_1.default.findOne({
                username,
                _id: { $ne: user._id },
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: "Username already taken",
                });
            }
            user.username = username.trim();
        }
        if (email) {
            const existingUser = await User_1.default.findOne({
                email: email.toLowerCase(),
                _id: { $ne: user._id },
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: "Email already taken",
                });
            }
            user.email = email.toLowerCase();
        }
        if (password) {
            // ✅ Plain password — pre('save') hook will hash it ONCE.
            user.password = password;
        }
        await user.save();
        console.log("Profile updated for user:", user.username);
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to update profile",
        });
    }
};
exports.updateProfile = updateProfile;
