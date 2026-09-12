// src/models/Category.ts
import mongoose, { Schema } from "mongoose";
const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        default: "",
    },
}, { timestamps: true });
export default mongoose.model("Category", CategorySchema);
