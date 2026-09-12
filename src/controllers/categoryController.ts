// src/controllers/categoryController.ts
import { Request, Response } from "express";
import Category from "../models/Category";
import { AuthRequest } from "../middleware/auth";

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching categories",
    });
  }
};

// Get single category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

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
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching category",
    });
  }
};

// Create a new category
export const createCategory = async (req: AuthRequest, res: Response) => {
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
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: "Category with this name already exists",
      });
    }

    const category = new Category({
      name: name.trim(),
      description: description || "",
    });

    await category.save();

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      error: "Error creating category",
    });
  }
};

// Update a category
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
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
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      error: "Error updating category",
    });
  }
};

// Delete a category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

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
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting category",
    });
  }
};
