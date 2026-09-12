// models/Installation.ts
import mongoose, { Schema } from "mongoose";
const InstallationItemSchema = new Schema({
    inventoryId: {
        type: Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
const InstallationSchema = new Schema({
    items: {
        type: [InstallationItemSchema],
        required: true,
        validate: {
            validator: (v) => v && v.length > 0,
            message: "At least one item is required",
        },
    },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled"],
        default: "completed",
    },
    scheduledDate: { type: Date },
    date: { type: Date, default: Date.now },
    installedBy: {
        type: Schema.Types.ObjectId,
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
export default mongoose.model("Installation", InstallationSchema);
