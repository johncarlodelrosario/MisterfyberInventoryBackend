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
// models/Installation.ts
const mongoose_1 = __importStar(require("mongoose"));
const InstallationItemSchema = new mongoose_1.Schema({
    inventoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
const InstallationSchema = new mongoose_1.Schema({
    items: {
        type: [InstallationItemSchema],
        required: true,
        validate: {
            validator: (v) => v && v.length > 0,
            message: "At least one item is required",
        },
    },
    siteId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Site", required: true },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled"],
        default: "completed",
    },
    scheduledDate: { type: Date },
    date: { type: Date, default: Date.now },
    installedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    notes: { type: String },
}, { timestamps: true });
// Performance indexes for ultra-fast queries
InstallationSchema.index({ date: -1 });
InstallationSchema.index({ siteId: 1, date: -1 });
InstallationSchema.index({ status: 1, date: -1 });
InstallationSchema.index({ siteId: 1, status: 1 });
InstallationSchema.index({ installedBy: 1 });
InstallationSchema.index({ scheduledDate: 1 }, { sparse: true });
exports.default = mongoose_1.default.model("Installation", InstallationSchema);
