import mongoose, { Schema } from "mongoose";
const SiteSchema = new Schema({
    name: {
        type: String,
        required: [true, "Site name is required"],
        unique: true,
        trim: true,
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Created by is required"],
    },
}, {
    timestamps: true,
});
// Index for better query performance
SiteSchema.index({ name: 1 });
const Site = mongoose.model("Site", SiteSchema);
export default Site;
