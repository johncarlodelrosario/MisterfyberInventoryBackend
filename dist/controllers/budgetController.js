import Budget from "../models/Budget";
import { cache, CACHE_KEYS } from "../config/cache";
export const createOrUpdateBudget = async (req, res) => {
    try {
        const { siteId, totalBudget } = req.body;
        let budget = await Budget.findOne({ siteId });
        if (budget) {
            budget.totalBudget = totalBudget;
            budget.lastUpdated = new Date();
            await budget.save();
        }
        else {
            budget = new Budget({
                siteId,
                totalBudget,
                spent: 0,
                remaining: totalBudget,
            });
            await budget.save();
        }
        cache.del(CACHE_KEYS.BUDGET);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error creating/updating budget" });
    }
};
export const getBudget = async (req, res) => {
    try {
        const siteId = req.query.siteId;
        if (!siteId) {
            return res.status(400).json({ error: "Site ID is required" });
        }
        const cacheKey = `${CACHE_KEYS.BUDGET}_${siteId}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        const budget = await Budget.findOne({ siteId }).populate("siteId", "name");
        if (!budget) {
            return res.status(404).json({ error: "Budget not found" });
        }
        cache.set(cacheKey, budget);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching budget" });
    }
};
export const addTransaction = async (req, res) => {
    try {
        const { siteId, amount, description, type, inventoryId } = req.body;
        const budget = await Budget.findOne({ siteId });
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
        cache.del(CACHE_KEYS.BUDGET);
        res.json(budget);
    }
    catch (error) {
        res.status(500).json({ error: "Error adding transaction" });
    }
};
