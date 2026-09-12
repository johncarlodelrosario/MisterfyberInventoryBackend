"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTransaction = exports.getBudget = exports.createOrUpdateBudget = void 0;
const Budget_1 = __importDefault(require("../models/Budget"));
const cache_1 = require("../config/cache");
const createOrUpdateBudget = async (req, res) => {
    try {
        const { siteId, totalBudget } = req.body;
        let budget = await Budget_1.default.findOne({ siteId });
        if (budget) {
            budget.totalBudget = totalBudget;
            budget.lastUpdated = new Date();
            await budget.save();
        }
        else {
            budget = new Budget_1.default({
                siteId,
                totalBudget,
                spent: 0,
                remaining: totalBudget,
            });
            await budget.save();
        }
        cache_1.cache.del(cache_1.CACHE_KEYS.BUDGET);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error creating/updating budget" });
    }
};
exports.createOrUpdateBudget = createOrUpdateBudget;
const getBudget = async (req, res) => {
    try {
        const siteId = req.query.siteId;
        if (!siteId) {
            return res.status(400).json({ error: "Site ID is required" });
        }
        const cacheKey = `${cache_1.CACHE_KEYS.BUDGET}_${siteId}`;
        const cachedData = cache_1.cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        const budget = await Budget_1.default.findOne({ siteId }).populate("siteId", "name");
        if (!budget) {
            return res.status(404).json({ error: "Budget not found" });
        }
        cache_1.cache.set(cacheKey, budget);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching budget" });
    }
};
exports.getBudget = getBudget;
const addTransaction = async (req, res) => {
    try {
        const { siteId, amount, description, type, inventoryId } = req.body;
        const budget = await Budget_1.default.findOne({ siteId });
        if (!budget) {
            return res.status(404).json({ error: "Budget not found" });
        }
        const transaction = {
            amount,
            description,
            date: new Date(),
            type,
            inventoryId,
        };
        budget.transactions.push(transaction);
        if (type === "expense") {
            budget.spent += amount;
        }
        budget.remaining = budget.totalBudget - budget.spent;
        budget.lastUpdated = new Date();
        await budget.save();
        cache_1.cache.del(cache_1.CACHE_KEYS.BUDGET);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error adding transaction" });
    }
};
exports.addTransaction = addTransaction;
