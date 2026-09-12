"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// models/Inventory.ts
const mongoose_1 = __importStar(require("mongoose"));
const InventorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    siteIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Site", required: true }],
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
exports.default = mongoose_1.default.model("Inventory", InventorySchema);
