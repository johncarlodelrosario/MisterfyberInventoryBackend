import mongoose, { Schema } from "mongoose";
const BudgetSchema = new Schema({
    siteId: {
        type: Schema.Types.ObjectId,
        ref: "Site",
        required: true,
        unique: true,
    },
    totalBudget: { type: Number, required: true, default: 0 },
    spent: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    transactions: [
        {
            amount: { type: Number, required: true },
            description: { type: String, required: true },
            date: { type: Date, default: Date.now },
            type: { type: String, enum: ["income", "expense"], required: true },
            inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory" },
        },
    ],
}, { timestamps: true });
BudgetSchema.pre("save", function (next) {
    this.remaining = this.totalBudget - this.spent;
    next();
});
export default mongoose.model("Budget", BudgetSchema);
//# sourceMappingURL=Budget.js.map