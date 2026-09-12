import mongoose, { Schema, Document } from "mongoose";

export interface ISite extends Document {
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const SiteSchema = new Schema<ISite>(
  {
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
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
SiteSchema.index({ name: 1 });

const Site = mongoose.model<ISite>("Site", SiteSchema);
export default Site;
