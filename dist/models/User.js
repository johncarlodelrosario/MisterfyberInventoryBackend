import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
}, {
    timestamps: true,
});
// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method - FIXED: Use function declaration instead of arrow function
UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        console.error("Password comparison error:", error);
        return false;
    }
};
// Remove password when converting to JSON
UserSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    },
});
// Create and export the model properly
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
//# sourceMappingURL=User.js.map