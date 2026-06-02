import mongoose from "mongoose";
import { SizeTypes } from "./product.model.js";


const cartItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        size: { type: String, enum: SizeTypes },
        quantity: { type: Number, required: true, min: 1 },
        priceAtMoment: { type: Number, required: true, min: 0 }
    }
);

const cartSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        items: { type: [cartItemSchema], default: [] },
        total: { type: Number, default: 0, min: 0 }
    },
    { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
