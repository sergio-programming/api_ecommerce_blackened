import mongoose from "mongoose";

export const paymentMethodOptions = ['Contraentrega', 'Stripe'];
export const shippingMethodOptions = ['Estandar', 'Express'];

const checkoutSchema = new mongoose.Schema(
    {
        cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        shippingAddress: { type: String, required: true, trim: true, minlength: 10 },
        city: { type: String, required: true, trim: true, minlength: 2 },
        phoneNumber: { type: String, required: true, trim: true, match: /^\d{10}$/ },
        shippingMethod: { type: String, enum: shippingMethodOptions, required: true },
        paymentMethod: { type: String, enum: paymentMethodOptions, required: true},
        total: { type: Number, required: true, min: 0 }
    },
    { timestamps: true }
);

export const Checkout = mongoose.model('Checkout', checkoutSchema);
