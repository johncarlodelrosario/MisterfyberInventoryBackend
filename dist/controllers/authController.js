import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
export const register = async (req, res) => {
    try {
        console.log("Registration request body:", req.body);
        const { username, email, password, role } = req.body;
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "Username, email, and password are required",
            });
        }
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "Username or email already exists",
            });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create user
        const user = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role || "user",
        });
        await user.save();
        console.log("User created successfully:", user.username);
        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
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
        // Handle validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                error: error.message,
                details: error.errors,
            });
        }
        // Handle duplicate key error
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
export const login = async (req, res) => {
    try {
        console.log("Login request body:", req.body);
        const { username, password } = req.body;
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "Username and password are required",
            });
        }
        // Find user by username (or email) - FIXED: explicitly include password field
        const user = await User.findOne({
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
        console.log("User has comparePassword method:", typeof user.comparePassword === "function");
        // Check password using the comparePassword method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("Invalid password for user:", user.username);
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        console.log("Login successful for user:", user.username);
        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
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
export const getProfile = async (req, res) => {
    try {
        console.log("Get profile request for user:", req.user?.username);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await User.findById(req.user._id).select("-password");
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
export const getMe = async (req, res) => {
    try {
        console.log("Get me request for user:", req.user?.username);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = await User.findById(req.user._id).select("-password");
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
export const logout = async (req, res) => {
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
export const updateProfile = async (req, res) => {
    try {
        console.log("Update profile request for user:", req.user?.username);
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { username, email, password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        // Update fields
        if (username) {
            // Check if username is taken
            const existingUser = await User.findOne({
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
            // Check if email is taken
            const existingUser = await User.findOne({
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
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
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
//# sourceMappingURL=authController.js.map