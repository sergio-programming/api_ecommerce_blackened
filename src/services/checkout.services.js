import { AppError } from "../helpers/error.helpers.js";
import { Checkout, paymentMethodOptions, shippingMethodOptions } from "../models/checkout.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";

const isMissing = (value) => value === undefined || value === null;
const normalizeText = (value) => typeof value === "string" ? value.trim() : value;

export const getCheckoutByUserService = async(userId) => {
    return Checkout.findOne({ user: userId }).lean().exec();
};

export const createCheckoutService = async(body) => {
    const checkout = await Checkout.create(body);
    return checkout.toObject();
};

export const updateCheckoutService = async(id, body) => {
    return Checkout.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: true }
    )
    .lean()
    .exec();
};

export const deleteCheckoutService = async(id) => {
    return Checkout.findByIdAndDelete(id).lean().exec();
}

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

    const existingUser = await User.findById(user).lean().exec();

    if (!existingUser) {
        throw new AppError("Usuario no encontrado", 404);
    }

    const existingCart = await Cart.findById(cart).lean().exec();

    if (!existingCart) {
        throw new AppError("Carrito no encontrado", 404);
    }

    if (shippingAddress.length < 10) {
        throw new AppError('La dirección debe tener una longitud mínima de 10 caracteres', 400);
    }

    if (city.length < 2) {
        throw new AppError('La ciudad debe tener una longitud minima de 2 caracteres', 400);
    }

    if (phoneNumber.length !== 10) {
        throw new AppError('El número telefónico debe tener una longitud válida', 400);
    }

    if (!shippingMethodOptions.includes(shippingMethod)) {
        throw new AppError('Debe seleccionar un metodo de envío válido', 400);
    }

    if (!paymentMethodOptions.includes(paymentMethod)) {
        throw new AppError('Debe seleccionar un metodo de pago válido', 400);
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

export const validateUpdateCheckoutInput = async(cartId, body) => {
    const updatedData = {};
    const allowedKeys = [
        'shippingAddress',
        'city',
        'phoneNumber',
        'shippingMethod',
        'paymentMethod'
    ]

    Object.keys(body).forEach((key) => {
        if(!allowedKeys.includes(key)) {
            return;
        }
        
        updatedData[key] = normalizeText(body[key]);
    });

    if (Object.keys(updatedData).length === 0) {
        throw new AppError("Debes enviar al menos un campo valido para actualizar", 400);
    }

    if (updatedData.shippingAddress && updatedData.shippingAddress.length < 10) {
        throw new AppError('La dirección debe tener una longitud mínima de 10 caracteres', 400);
    }

    if (updatedData.city !== undefined && updatedData.city.length < 2) {
        throw new AppError('La ciudad debe tener una longitud minima de 2 caracteres', 400);
    }

    if (updatedData.phoneNumber && updatedData.phoneNumber.length !== 10) {
        throw new AppError('El número telefónico debe tener una longitud válida', 400);
    }

    if (updatedData.shippingMethod && !shippingMethodOptions.includes(updatedData.shippingMethod)) {
        throw new AppError('Debe seleccionar un metodo de envío válido', 400);
    }

    if (updatedData.paymentMethod && !paymentMethodOptions.includes(updatedData.paymentMethod)) {
        throw new AppError('Debe seleccionar un metodo de envío válido', 400);
    }

    const cart = await Cart.findById(cartId).lean().exec();

    if (!cart) {
        throw new AppError('Carrito no encontrado', 404);
    }

    const total = cart.items.reduce(
        (sum, item) => sum + item.priceAtMoment * item.quantity,
        0
    ); 

    updatedData.total = total;

    return updatedData;   

};


