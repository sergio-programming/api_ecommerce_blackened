import mongoose from "mongoose";
import { shippingMethodOptions } from "./checkout.model.js";
import { SizeTypes } from "./product.model.js";

export const OrderStatus = ["Pendiente", "Enviada", "Entregada", "Cancelada"];
export const PaymentStatus = ["Pendiente", "Pagada", "Rechazado"];

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        size: { type: String, enum: SizeTypes },
        quantity: { type: Number, required: true, min: 1 },
        priceAtMoment: { type: Number, required: true, min: 0 }
    }
);

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        items: { type: [orderItemSchema], required: true },
        shippingAddress: { type: String, required: true, trim: true, minlength: 10 },
        city: { type: String, required: true, trim: true, minlength: 2 },
        phoneNumber: { type: String, required: true, trim: true, minlength: 10, maxlength: 10 },
        shippingMethod: { type: String, enum: shippingMethodOptions, required: true },
        paymentMethod: { type: String, required: true, trim: true },
        status: { type: String, enum: OrderStatus, default: "Pendiente" },
        paymentStatus: { type: String, enum: PaymentStatus, default: "Pendiente" },
        total: { type: Number, required: true, min: 0 }
    },
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
