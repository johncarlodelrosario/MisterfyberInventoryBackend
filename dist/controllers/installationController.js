"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryValueBySite = exports.getInventoryBySite = exports.getSiteInventoryDetails = exports.getDailyInstallations = exports.deleteInstallation = exports.updateInstallationStatus = exports.getInstallations = exports.createInstallation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Installation_1 = __importDefault(require("../models/Installation"));
const Inventory_1 = __importDefault(require("../models/Inventory"));
// Helper: Safely get a number from either a Map or plain object
const getNumericValue = (container, key, defaultValue = 0) => {
    if (!container)
        return defaultValue;
    // Handle Map (has .get method)
    if (typeof container.get === "function") {
        const value = container.get(key);
        return typeof value === "number" ? value : defaultValue;
    }
    // Handle plain object
    if (typeof container === "object") {
        const value = container[key];
        return typeof value === "number" ? value : defaultValue;
    }
    return defaultValue;
};
// Helper: deduct quantity for a list of items at a site - OPTIMIZED with bulk operations
const deductItemsFromInventory = async (items, siteId) => {
    const siteIdStr = siteId.toString();
    const siteObjectId = new mongoose_1.default.Types.ObjectId(siteId);
    // Fetch all inventory items in parallel
    const inventoryIds = items.map((item) => item.inventoryId);
    const inventories = await Inventory_1.default.find({
        _id: { $in: inventoryIds },
    }).lean();
    const inventoryMap = new Map(inventories.map((inv) => [inv._id.toString(), inv]));
    // Validate all items first
    const bulkOps = [];
    for (const item of items) {
        const inventory = inventoryMap.get(item.inventoryId);
        if (!inventory) {
            throw new Error(`Inventory item not found: ${item.inventoryId}`);
        }
        const siteExists = inventory.siteIds.some((id) => id.equals ? id.equals(siteObjectId) : id.toString() === siteId);
        if (!siteExists) {
            throw new Error(`Inventory "${inventory.name}" is not available at the selected site`);
        }
        const currentQuantity = getNumericValue(inventory.quantities, siteIdStr, 0);
        if (currentQuantity < item.quantity) {
            throw new Error(`Insufficient quantity for "${inventory.name}". Available: ${currentQuantity}, requested: ${item.quantity}`);
        }
        // Prepare bulk update
        bulkOps.push({
            updateOne: {
                filter: { _id: item.inventoryId },
                update: {
                    $inc: { [`quantities.${siteIdStr}`]: -item.quantity },
                    $set: { lastUpdated: new Date() },
                },
            },
        });
    }
    // Execute all updates in a single bulk operation
    if (bulkOps.length > 0) {
        await Inventory_1.default.bulkWrite(bulkOps, { ordered: false });
    }
};
// Helper: restore quantity for a list of items at a site (used when deleting installations)
const restoreItemsToInventory = async (items, siteId) => {
    const siteIdStr = siteId.toString();
    const bulkOps = [];
    for (const item of items) {
        bulkOps.push({
            updateOne: {
                filter: { _id: item.inventoryId },
                update: {
                    $inc: { [`quantities.${siteIdStr}`]: item.quantity },
                    $set: { lastUpdated: new Date() },
                },
            },
        });
    }
    if (bulkOps.length > 0) {
        await Inventory_1.default.bulkWrite(bulkOps, { ordered: false });
    }
};
const createInstallation = async (req, res) => {
    try {
        const { items, siteId, scheduledDate, notes } = req.body;
        // Fast validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "At least one item is required" });
        }
        if (!siteId) {
            return res.status(400).json({ error: "Site ID is required" });
        }
        // Validate each item quickly
        for (const item of items) {
            if (!item.inventoryId || !item.quantity || item.quantity < 1) {
                return res.status(400).json({
                    error: "Invalid item: inventory ID and quantity (min 1) required",
                });
            }
        }
        const isScheduled = !!scheduledDate;
        // If not scheduled (immediate), deduct inventory now
        if (!isScheduled) {
            try {
                await deductItemsFromInventory(items, siteId);
            }
            catch (err) {
                return res.status(400).json({ error: err.message });
            }
        }
        const installation = new Installation_1.default({
            items: items.map((i) => ({
                inventoryId: i.inventoryId,
                quantity: i.quantity,
            })),
            siteId,
            status: isScheduled ? "scheduled" : "completed",
            scheduledDate: scheduledDate || undefined,
            notes,
            installedBy: req.user._id,
            date: new Date(),
        });
        await installation.save();
        // Populate and return immediately
        const populated = await Installation_1.default.findById(installation._id)
            .populate("items.inventoryId", "name unit")
            .populate("siteId", "name")
            .populate("installedBy", "username")
            .lean();
        res.status(201).json(populated);
    }
    catch (error) {
        console.error("Error creating installation:", error);
        res.status(500).json({ error: "Error creating installation" });
    }
};
exports.createInstallation = createInstallation;
const getInstallations = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const siteId = req.query.siteId;
        const status = req.query.status;
        const date = req.query.date;
        const filter = {};
        if (siteId)
            filter.siteId = new mongoose_1.default.Types.ObjectId(siteId);
        if (status)
            filter.status = status;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filter.date = { $gte: startDate, $lte: endDate };
        }
        // Ultra-fast: use lean() and parallel queries
        const [installations, total] = await Promise.all([
            Installation_1.default.find(filter)
                .select("-__v")
                .populate("items.inventoryId", "name price unit")
                .populate("siteId", "name")
                .populate("installedBy", "username")
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Installation_1.default.countDocuments(filter),
        ]);
        // Set cache headers for browser caching (but not server cache)
        res.set("Cache-Control", "private, max-age=10");
        res.json({
            installations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching installations:", error);
        res.status(500).json({ error: "Error fetching installations" });
    }
};
exports.getInstallations = getInstallations;
const updateInstallationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        if (!["scheduled", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        // Fast fetch with lean
        const installation = await Installation_1.default.findById(id).lean();
        if (!installation) {
            return res.status(404).json({ error: "Installation not found" });
        }
        // If completing a scheduled installation, deduct from inventory
        if (status === "completed" && installation.status === "scheduled") {
            try {
                await deductItemsFromInventory(installation.items.map((i) => ({
                    inventoryId: i.inventoryId.toString(),
                    quantity: i.quantity,
                })), installation.siteId.toString());
            }
            catch (err) {
                return res.status(400).json({ error: err.message });
            }
        }
        // Update with single operation
        const updateData = { status };
        if (status === "completed" && installation.status === "scheduled") {
            updateData.date = new Date();
        }
        const updated = await Installation_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            lean: true,
        })
            .populate("items.inventoryId", "name unit")
            .populate("siteId", "name")
            .populate("installedBy", "username");
        res.json(updated);
    }
    catch (error) {
        console.error("Error updating installation:", error);
        res.status(500).json({ error: "Error updating installation" });
    }
};
exports.updateInstallationStatus = updateInstallationStatus;
// NEW: Delete installation
const deleteInstallation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid installation ID" });
        }
        // Fast fetch with lean
        const installation = await Installation_1.default.findById(id).lean();
        if (!installation) {
            return res.status(404).json({ error: "Installation not found" });
        }
        // If the installation was completed (inventory was deducted), restore it
        // Scheduled installations never deducted inventory, so no restore needed
        if (installation.status === "completed") {
            try {
                await restoreItemsToInventory(installation.items.map((i) => ({
                    inventoryId: i.inventoryId.toString(),
                    quantity: i.quantity,
                })), installation.siteId.toString());
            }
            catch (err) {
                console.error("Error restoring inventory on delete:", err);
                // Continue with deletion even if restore fails
            }
        }
        // Delete the installation
        await Installation_1.default.findByIdAndDelete(id);
        res.json({
            success: true,
            message: "Installation deleted successfully",
            deletedId: id,
        });
    }
    catch (error) {
        console.error("Error deleting installation:", error);
        res.status(500).json({ error: "Error deleting installation" });
    }
};
exports.deleteInstallation = deleteInstallation;
const getDailyInstallations = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        // Use aggregation for ultra-fast daily stats
        const result = await Installation_1.default.aggregate([
            {
                $match: {
                    date: { $gte: targetDate, $lt: nextDate },
                    status: "completed",
                },
            },
            {
                $lookup: {
                    from: "inventories",
                    localField: "items.inventoryId",
                    foreignField: "_id",
                    as: "inventoryDetails",
                    pipeline: [{ $project: { name: 1, price: 1, unit: 1 } }],
                },
            },
            {
                $lookup: {
                    from: "sites",
                    localField: "siteId",
                    foreignField: "_id",
                    as: "siteDetails",
                    pipeline: [{ $project: { name: 1 } }],
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "installedBy",
                    foreignField: "_id",
                    as: "userDetails",
                    pipeline: [{ $project: { username: 1 } }],
                },
            },
            {
                $addFields: {
                    items: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: {
                                inventoryId: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$inventoryDetails",
                                                cond: { $eq: ["$$this._id", "$$item.inventoryId"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                quantity: "$$item.quantity",
                            },
                        },
                    },
                    siteId: { $arrayElemAt: ["$siteDetails", 0] },
                    installedBy: { $arrayElemAt: ["$userDetails", 0] },
                },
            },
            { $project: { inventoryDetails: 0, siteDetails: 0, userDetails: 0 } },
        ]);
        const totalQuantity = result.reduce((sum, inst) => sum + inst.items.reduce((s, item) => s + item.quantity, 0), 0);
        res.set("Cache-Control", "private, max-age=30");
        res.json({
            date: targetDate,
            total: result.length,
            totalQuantity,
            installations: result,
        });
    }
    catch (error) {
        console.error("Error fetching daily installations:", error);
        res.status(500).json({ error: "Error fetching daily installations" });
    }
};
exports.getDailyInstallations = getDailyInstallations;
// ---- Helper endpoints (optimized) ----
const getSiteInventoryDetails = async (req, res) => {
    try {
        const { inventoryId, siteId } = req.params;
        const inventory = await Inventory_1.default.findById(inventoryId)
            .populate("categoryId", "name")
            .populate("siteIds", "name")
            .lean();
        if (!inventory) {
            return res.status(404).json({ error: "Inventory item not found" });
        }
        const siteObjectId = new mongoose_1.default.Types.ObjectId(siteId);
        const siteExists = inventory.siteIds.some((id) => {
            if (!id)
                return false;
            const idValue = id._id || id;
            return idValue.equals
                ? idValue.equals(siteObjectId)
                : idValue.toString() === siteId;
        });
        if (!siteExists) {
            return res
                .status(404)
                .json({ error: "Inventory item not available at this site" });
        }
        const siteIdStr = siteId.toString();
        const quantity = getNumericValue(inventory.quantities, siteIdStr, 0);
        const price = getNumericValue(inventory.prices, siteIdStr, 0);
        const minQuantity = getNumericValue(inventory.minQuantities, siteIdStr, 0);
        res.set("Cache-Control", "private, max-age=60");
        res.json({
            success: true,
            data: {
                inventoryId: inventory._id,
                name: inventory.name,
                siteId,
                quantity,
                price,
                minQuantity,
                unit: inventory.unit,
                totalValue: quantity * price,
            },
        });
    }
    catch (error) {
        console.error("Error fetching site inventory details:", error);
        res.status(500).json({ error: "Error fetching site inventory details" });
    }
};
exports.getSiteInventoryDetails = getSiteInventoryDetails;
const getInventoryBySite = async (req, res) => {
    try {
        const { siteId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const search = req.query.search;
        if (!siteId) {
            return res.status(400).json({ error: "Site ID is required" });
        }
        const siteObjectId = new mongoose_1.default.Types.ObjectId(siteId);
        const filter = { siteIds: { $in: [siteObjectId] } };
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        const [inventory, total] = await Promise.all([
            Inventory_1.default.find(filter)
                .select("name categoryId unit description quantities prices minQuantities lastUpdated")
                .populate("categoryId", "name")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Inventory_1.default.countDocuments(filter),
        ]);
        const siteIdStr = siteId.toString();
        const formattedInventory = inventory.map((item) => {
            const quantity = getNumericValue(item.quantities, siteIdStr, 0);
            const price = getNumericValue(item.prices, siteIdStr, 0);
            const minQuantity = getNumericValue(item.minQuantities, siteIdStr, 0);
            return {
                _id: item._id,
                name: item.name,
                categoryId: item.categoryId,
                unit: item.unit,
                description: item.description,
                siteQuantity: quantity,
                sitePrice: price,
                siteMinQuantity: minQuantity,
                siteTotalValue: quantity * price,
                lastUpdated: item.lastUpdated,
            };
        });
        res.set("Cache-Control", "private, max-age=15");
        res.json({
            success: true,
            inventory: formattedInventory,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching inventory by site:", error);
        res.status(500).json({ error: "Error fetching inventory by site" });
    }
};
exports.getInventoryBySite = getInventoryBySite;
const getInventoryValueBySite = async (req, res) => {
    try {
        const { siteId } = req.params;
        if (!siteId) {
            return res.status(400).json({ error: "Site ID is required" });
        }
        const siteObjectId = new mongoose_1.default.Types.ObjectId(siteId);
        const siteIdStr = siteId.toString();
        // Use aggregation for ultra-fast value calculation
        const result = await Inventory_1.default.aggregate([
            { $match: { siteIds: { $in: [siteObjectId] } } },
            {
                $project: {
                    name: 1,
                    quantity: { $ifNull: [`$quantities.${siteIdStr}`, 0] },
                    price: { $ifNull: [`$prices.${siteIdStr}`, 0] },
                },
            },
            {
                $addFields: {
                    value: { $multiply: ["$quantity", "$price"] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$value" },
                    items: {
                        $push: {
                            name: "$name",
                            quantity: "$quantity",
                            price: "$price",
                            value: "$value",
                        },
                    },
                    itemCount: { $sum: 1 },
                },
            },
        ]);
        const data = result[0] || { totalValue: 0, items: [], itemCount: 0 };
        res.set("Cache-Control", "private, max-age=60");
        res.json({
            success: true,
            siteId,
            totalValue: data.totalValue,
            items: data.items,
            itemCount: data.itemCount,
        });
    }
    catch (error) {
        console.error("Error fetching inventory value by site:", error);
        res.status(500).json({ error: "Error fetching inventory value by site" });
    }
};
exports.getInventoryValueBySite = getInventoryValueBySite;
