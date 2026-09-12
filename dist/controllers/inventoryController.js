"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductInventory = exports.deleteInventory = exports.updateInventory = exports.getInventoryById = exports.getInventory = exports.createInventory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Inventory_1 = __importDefault(require("../models/Inventory"));
const Category_1 = __importDefault(require("../models/Category"));
const Site_1 = __importDefault(require("../models/Site"));
const createInventory = async (req, res) => {
    try {
        const { name, categoryId, siteData, unit, description } = req.body;
        // Validate category exists
        if (categoryId) {
            const category = await Category_1.default.findById(categoryId);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found",
                });
            }
        }
        // Validate all sites exist
        const siteIds = siteData.map((s) => s.siteId);
        const sites = await Site_1.default.find({ _id: { $in: siteIds } });
        if (sites.length !== siteIds.length) {
            return res.status(404).json({
                success: false,
                error: "One or more sites not found",
            });
        }
        // Build quantities, prices, minQuantities maps
        const quantities = new Map();
        const prices = new Map();
        const minQuantities = new Map();
        siteData.forEach((s) => {
            quantities.set(s.siteId, s.quantity || 0);
            prices.set(s.siteId, s.price || 0);
            minQuantities.set(s.siteId, s.minQuantity || 0);
        });
        const inventory = new Inventory_1.default({
            name,
            categoryId,
            siteIds: siteIds,
            quantities,
            prices,
            minQuantities,
            unit: unit || "pcs",
            description: description || "",
        });
        await inventory.save();
        // Populate references for response
        await inventory.populate("categoryId", "name");
        await inventory.populate("siteIds", "name");
        // Format response
        const formattedInventory = formatInventoryResponse(inventory);
        res.status(201).json({
            success: true,
            inventory: formattedInventory,
        });
    }
    catch (error) {
        console.error("Error creating inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error creating inventory item",
        });
    }
};
exports.createInventory = createInventory;
const getInventory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const siteId = req.query.siteId;
        const categoryId = req.query.categoryId;
        const search = req.query.search;
        const filter = {};
        if (categoryId)
            filter.categoryId = categoryId;
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        // If siteId filter is provided, find items that include this site
        if (siteId) {
            filter.siteIds = { $in: [siteId] };
        }
        const [inventory, total] = await Promise.all([
            Inventory_1.default.find(filter)
                .populate("categoryId", "name")
                .populate("siteIds", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Inventory_1.default.countDocuments(filter),
        ]);
        // Format response with site-specific data
        const formattedInventory = inventory.map((item) => formatInventoryResponse(item));
        const response = {
            success: true,
            inventory: formattedInventory,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error fetching inventory",
        });
    }
};
exports.getInventory = getInventory;
const getInventoryById = async (req, res) => {
    try {
        const inventory = await Inventory_1.default.findById(req.params.id)
            .populate("categoryId", "name")
            .populate("siteIds", "name");
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: "Inventory item not found",
            });
        }
        const formattedInventory = formatInventoryResponse(inventory);
        res.json({
            success: true,
            inventory: formattedInventory,
        });
    }
    catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error fetching inventory",
        });
    }
};
exports.getInventoryById = getInventoryById;
const updateInventory = async (req, res) => {
    try {
        const { name, categoryId, siteData, unit, description } = req.body;
        const inventory = await Inventory_1.default.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: "Inventory item not found",
            });
        }
        // Validate category exists if updating
        if (categoryId && categoryId !== inventory.categoryId?.toString()) {
            const category = await Category_1.default.findById(categoryId);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    error: "Category not found",
                });
            }
            inventory.categoryId = categoryId;
        }
        // Update site data if provided
        if (siteData && Array.isArray(siteData) && siteData.length > 0) {
            // Validate all sites exist
            const siteIds = siteData.map((s) => s.siteId);
            const sites = await Site_1.default.find({ _id: { $in: siteIds } });
            if (sites.length !== siteIds.length) {
                return res.status(404).json({
                    success: false,
                    error: "One or more sites not found",
                });
            }
            // Update quantities, prices, minQuantities maps
            const quantities = new Map();
            const prices = new Map();
            const minQuantities = new Map();
            siteData.forEach((s) => {
                quantities.set(s.siteId, s.quantity || 0);
                prices.set(s.siteId, s.price || 0);
                minQuantities.set(s.siteId, s.minQuantity || 0);
            });
            inventory.siteIds = siteIds;
            inventory.quantities = quantities;
            inventory.prices = prices;
            inventory.minQuantities = minQuantities;
        }
        // Update other fields
        if (name)
            inventory.name = name;
        if (unit)
            inventory.unit = unit;
        if (description !== undefined)
            inventory.description = description;
        inventory.lastUpdated = new Date();
        await inventory.save();
        // Populate references for response
        await inventory.populate("categoryId", "name");
        await inventory.populate("siteIds", "name");
        const formattedInventory = formatInventoryResponse(inventory);
        res.json({
            success: true,
            inventory: formattedInventory,
        });
    }
    catch (error) {
        console.error("Error updating inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error updating inventory",
        });
    }
};
exports.updateInventory = updateInventory;
const deleteInventory = async (req, res) => {
    try {
        const inventory = await Inventory_1.default.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: "Inventory item not found",
            });
        }
        await inventory.deleteOne();
        res.json({
            success: true,
            message: "Inventory item deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error deleting inventory",
        });
    }
};
exports.deleteInventory = deleteInventory;
const deductInventory = async (req, res) => {
    try {
        const { siteId, quantity } = req.body;
        const inventory = await Inventory_1.default.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({
                success: false,
                error: "Inventory item not found",
            });
        }
        // Check if site exists in this inventory
        const siteObjectId = new mongoose_1.default.Types.ObjectId(siteId);
        const siteExists = inventory.siteIds.some((id) => id.equals(siteObjectId));
        if (!siteExists) {
            return res.status(404).json({
                success: false,
                error: "Site not found for this inventory item",
            });
        }
        const currentQuantity = inventory.quantities.get(siteId) || 0;
        if (currentQuantity < quantity) {
            return res.status(400).json({
                success: false,
                error: "Insufficient quantity for this site",
            });
        }
        // Deduct from specific site
        inventory.quantities.set(siteId, currentQuantity - quantity);
        inventory.lastUpdated = new Date();
        await inventory.save();
        res.json({
            success: true,
            message: "Inventory deducted successfully",
            remainingQuantity: inventory.quantities.get(siteId),
        });
    }
    catch (error) {
        console.error("Error deducting inventory:", error);
        res.status(500).json({
            success: false,
            error: "Error deducting inventory",
        });
    }
};
exports.deductInventory = deductInventory;
// Helper function to format inventory response
const formatInventoryResponse = (inventory) => {
    const sitesData = inventory.siteIds.map((site) => {
        const siteId = site._id || site;
        return {
            siteId: siteId,
            siteName: site.name || "Unknown",
            quantity: inventory.quantities.get(siteId.toString()) || 0,
            price: inventory.prices.get(siteId.toString()) || 0,
            minQuantity: inventory.minQuantities.get(siteId.toString()) || 0,
            totalValue: (inventory.quantities.get(siteId.toString()) || 0) *
                (inventory.prices.get(siteId.toString()) || 0),
        };
    });
    const totalValue = sitesData.reduce((sum, s) => sum + s.totalValue, 0);
    return {
        _id: inventory._id,
        name: inventory.name,
        categoryId: inventory.categoryId,
        sitesData,
        siteIds: inventory.siteIds,
        unit: inventory.unit,
        description: inventory.description,
        totalValue,
        lastUpdated: inventory.lastUpdated,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
    };
};
