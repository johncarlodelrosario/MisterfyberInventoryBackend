"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find().sort({ name: 1 });
        res.json({
            success: true,
            categories,
        });
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            error: "Error fetching categories",
        });
    }
};
exports.getCategories = getCategories;
// Get single category by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "Category not found",
            });
        }
        res.json({
            success: true,
            category,
        });
    }
    catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({
            success: false,
            error: "Error fetching category",
        });
    }
};
exports.getCategoryById = getCategoryById;
// Create a new category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: "Name is required",
            });
        }
        // Check if category already exists (case insensitive)
        const existingCategory = await Category_1.default.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: "Category with this name already exists",
            });
        }
        const category = new Category_1.default({
            name: name.trim(),
            description: description || "",
        });
        await category.save();
        res.status(201).json({
            success: true,
            category,
        });
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({
            success: false,
            error: "Error creating category",
        });
    }
};
exports.createCategory = createCategory;
// Update a category
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryId = req.params.id;
        const category = await Category_1.default.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "Category not found",
            });
        }
        // Check if new name conflicts with existing category
        if (name && name !== category.name) {
            const existingCategory = await Category_1.default.findOne({
                name: { $regex: new RegExp(`^${name}$`, "i") },
                _id: { $ne: categoryId },
            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    error: "Category with this name already exists",
                });
            }
            category.name = name.trim();
        }
        if (description !== undefined) {
            category.description = description;
        }
        await category.save();
        res.json({
            success: true,
            category,
        });
    }
    catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            success: false,
            error: "Error updating category",
        });
    }
};
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "Category not found",
            });
        }
        // Check if category is being used in inventory
        const Inventory = require("../models/Inventory").default;
        const inventoryCount = await Inventory.countDocuments({
            categoryId: req.params.id,
        });
        if (inventoryCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category. It is being used by ${inventoryCount} inventory item(s).`,
            });
        }
        await category.deleteOne();
        res.json({
            success: true,
            message: "Category deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            success: false,
            error: "Error deleting category",
        });
    }
};
exports.deleteCategory = deleteCategory;
