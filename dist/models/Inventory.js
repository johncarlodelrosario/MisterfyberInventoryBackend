// models/Inventory.ts
import mongoose, { Schema } from "mongoose";
const InventorySchema = new Schema({
    name: { type: String, required: true },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    siteIds: [{ type: Schema.Types.ObjectId, ref: "Site", required: true }],
    quantities: {
        type: Map,
        of: Number,
        default: new Map(),
    },
    prices: {
        type: Map,
        of: Number,
        default: new Map(),
    },
    minQuantities: {
        type: Map,
        of: Number,
        default: new Map(),
    },
    unit: { type: String, required: true, default: "pcs" },
    description: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    totalValue: { type: Number, default: 0 },
}, { timestamps: true });
// Performance indexes for ultra-fast queries
InventorySchema.index({ siteIds: 1 });
InventorySchema.index({ name: 1 });
InventorySchema.index({ categoryId: 1 });
InventorySchema.index({ siteIds: 1, name: 1 });
InventorySchema.index({ siteIds: 1, categoryId: 1 });
InventorySchema.index({ lastUpdated: -1 });
// Calculate total value before saving
InventorySchema.pre("save", function (next) {
    let total = 0;
    for (const [siteId, quantity] of this.quantities) {
        const price = this.prices.get(siteId) || 0;
        total += quantity * price;
    }
    this.totalValue = total;
    next();
});
export default mongoose.model("Inventory", InventorySchema);
