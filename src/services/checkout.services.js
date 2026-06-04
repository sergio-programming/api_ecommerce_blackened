import { AppError } from "../helpers/error.helpers.js";
import {
    ensureValidObjectId,
    isMissing,
    isTenDigitPhone,
    normalizeText
} from "../helpers/validation.helpers.js";
import { Checkout, paymentMethodOptions, shippingMethodOptions } from "../models/checkout.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";

export const getCheckoutByUserService = async(userId) => {
    ensureValidObjectId(userId, "usuario");

    return Checkout.findOne({ user: userId }).lean().exec();
};

export const createCheckoutService = async(body) => {
    const checkout = await Checkout.create(body);
    return checkout.toObject();
};

export const updateCheckoutService = async(id, body) => {
    ensureValidObjectId(id);

    return Checkout.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: "after", runValidators: true }
    )
    .lean()
    .exec();
};

export const deleteCheckoutService = async(id) => {
    ensureValidObjectId(id);

    return Checkout.findByIdAndDelete(id).lean().exec();
};

export const assertCheckoutBelongsToUser = async(checkoutId, userId) => {
    ensureValidObjectId(checkoutId);
    ensureValidObjectId(userId, "usuario");

    const checkout = await Checkout.findOne({ _id: checkoutId, user: userId }).select("_id").lean().exec();

    if (!checkout) {
        throw new AppError("Checkout no encontrado para este usuario", 404);
    }
};

export const validateCreateCheckoutInput = async(body) => {
    const user = body.user;
    const cart = body.cart;
    const shippingAddress = normalizeText(body.shippingAddress);
    const city = normalizeText(body.city);
    const phoneNumber = normalizeText(body.phoneNumber);
    const shippingMethod = normalizeText(body.shippingMethod);
    const paymentMethod = normalizeText(body.paymentMethod);

    if (
        isMissing(user) ||
        isMissing(cart) ||
        isMissing(shippingAddress) ||
        isMissing(city) ||
        isMissing(phoneNumber) ||
        isMissing(shippingMethod) ||
        isMissing(paymentMethod)
    ) {
        throw new AppError("Los campos requeridos son obligatorios", 400);
    }

    ensureValidObjectId(user, "usuario");
    ensureValidObjectId(cart, "carrito");

    const existingUser = await User.findById(user).lean().exec();

    if (!existingUser) {
        throw new AppError("Usuario no encontrado", 404);
    }

    if (!existingUser.isActive) {
        throw new AppError("Usuario inactivo", 403);
    }

    const existingCart = await Cart.findOne({ _id: cart, user }).lean().exec();

    if (!existingCart) {
        throw new AppError("Carrito no encontrado para este usuario", 404);
    }

    if (!Array.isArray(existingCart.items) || existingCart.items.length === 0) {
        throw new AppError("No puedes crear checkout con un carrito vacio", 400);
    }

    if (shippingAddress.length < 10) {
        throw new AppError("La direccion debe tener una longitud minima de 10 caracteres", 400);
    }

    if (city.length < 2) {
        throw new AppError("La ciudad debe tener una longitud minima de 2 caracteres", 400);
    }

    if (!isTenDigitPhone(phoneNumber)) {
        throw new AppError("El numero telefonico debe tener 10 digitos", 400);
    }

    if (!shippingMethodOptions.includes(shippingMethod)) {
        throw new AppError("Debe seleccionar un metodo de envio valido", 400);
    }

    if (!paymentMethodOptions.includes(paymentMethod)) {
        throw new AppError("Debe seleccionar un metodo de pago valido", 400);
    }

    const total = existingCart.items.reduce(
        (sum, item) => sum + item.priceAtMoment * item.quantity,
        0
    );

    return {
        user,
        cart,
        shippingAddress,
        city,
        phoneNumber,
        shippingMethod,
        paymentMethod,
        total
    };
};

export const validateUpdateCheckoutInput = async(cartId, userId, body) => {
    const updatedData = {};
    const allowedKeys = [
        "shippingAddress",
        "city",
        "phoneNumber",
        "shippingMethod",
        "paymentMethod"
    ];

    Object.keys(body).forEach((key) => {
        if (!allowedKeys.includes(key)) {
            return;
        }

        updatedData[key] = normalizeText(body[key]);
    });

    if (Object.keys(updatedData).length === 0) {
        throw new AppError("Debes enviar al menos un campo valido para actualizar", 400);
    }

    if (updatedData.shippingAddress !== undefined && updatedData.shippingAddress.length < 10) {
        throw new AppError("La direccion debe tener una longitud minima de 10 caracteres", 400);
    }

    if (updatedData.city !== undefined && updatedData.city.length < 2) {
        throw new AppError("La ciudad debe tener una longitud minima de 2 caracteres", 400);
    }

    if (updatedData.phoneNumber !== undefined && !isTenDigitPhone(updatedData.phoneNumber)) {
        throw new AppError("El numero telefonico debe tener 10 digitos", 400);
    }

    if (updatedData.shippingMethod && !shippingMethodOptions.includes(updatedData.shippingMethod)) {
        throw new AppError("Debe seleccionar un metodo de envio valido", 400);
    }

    if (updatedData.paymentMethod && !paymentMethodOptions.includes(updatedData.paymentMethod)) {
        throw new AppError("Debe seleccionar un metodo de pago valido", 400);
    }

    ensureValidObjectId(cartId, "carrito");
    ensureValidObjectId(userId, "usuario");

    const cart = await Cart.findOne({ _id: cartId, user: userId }).lean().exec();

    if (!cart) {
        throw new AppError("Carrito no encontrado para este usuario", 404);
    }

    if (!Array.isArray(cart.items) || cart.items.length === 0) {
        throw new AppError("No puedes actualizar checkout con un carrito vacio", 400);
    }

    updatedData.total = cart.items.reduce(
        (sum, item) => sum + item.priceAtMoment * item.quantity,
        0
    );

    return updatedData;
};
