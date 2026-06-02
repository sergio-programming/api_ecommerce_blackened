import { AppError } from "../helpers/error.helpers.js";
import { shippingMethodOptions } from "../models/checkout.model.js";
import { Order, OrderStatus, PaymentStatus } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";

const buildItemsWithTotal = async(items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError("Debes enviar al menos un producto en la orden", 400);
    }

    const normalizedItems = [];
    let total = 0;

    for (const item of items) {
        if (!item.product || !item.quantity) {
            throw new AppError("Cada item debe incluir producto y cantidad", 400);
        }

        if (item.quantity < 1) {
            throw new AppError("La cantidad debe ser mayor o igual a 1", 400);
        }

        const product = await Product.findById(item.product).lean().exec();

        if (!product) {
            throw new AppError("Uno de los productos no existe", 404);
        }

        if (product.stock < item.quantity) {
            throw new AppError("Stock insuficiente para uno de los productos", 400);
        }

        const priceAtMoment = product.price;
        total += priceAtMoment * item.quantity;

        normalizedItems.push({
            product: product._id,
            size: item.size,
            quantity: item.quantity,
            priceAtMoment
        });
    }

    return { normalizedItems, total };
};

const getTransportationCost = (shippingMethod) => {
    if (shippingMethod === "Estandar") {
        return 8000;
    }

    if (shippingMethod === "Express") {
        return 12000;
    }

    return 0;
};

export const getOrdersService = async() => {
    return Order.find()
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
};

export const getOrderService = async(id) => {
    return Order.findById(id)
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const getOrdersByUserService = async(userId) => {
    return Order.find({ user: userId })
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
};

export const createOrderService = async(body) => {
    const order = await Order.create(body);
    return order.toObject();
};

export const updateOrderService = async(id, body) => {
    return Order.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after' })
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const deleteOrderService = async(id) => {
    return Order.findByIdAndDelete(id).lean().exec();
};

export const validateCreateOrderInput = async(body) => {
    const { user, items, shippingAddress, city, shippingMethod, paymentMethod, status, paymentStatus } = body;

    if (!user || !items || !shippingAddress || !city || !shippingMethod || !paymentMethod) {
        throw new AppError("Los campos requeridos son obligatorios", 400);
    }

    const existingUser = await User.findById(user).lean().exec();

    if (!existingUser) {
        throw new AppError("Usuario no encontrado", 404);
    }

    if (!existingUser.isActive) {
        throw new AppError("Usuario inactivo", 403);
    }

    if (shippingAddress.trim().length < 10) {
        throw new AppError("La direccion de envio debe tener minimo 10 caracteres", 400);
    }

    if (city.trim().length < 2) {
        throw new AppError("La ciudad debe tener minimo 2 caracteres", 400);
    }

    const normalizedShippingMethod = shippingMethod.trim();

    if (!shippingMethodOptions.includes(normalizedShippingMethod)) {
        throw new AppError("Debes asignar un metodo de entrega valido", 400);
    }

    if (status && !OrderStatus.includes(status)) {
        throw new AppError("Debes asignar un estado de orden valido", 400);
    }

    if (paymentStatus && !PaymentStatus.includes(paymentStatus)) {
        throw new AppError("Debes asignar un estado de pago valido", 400);
    }

    const { normalizedItems, total: itemsTotal } = await buildItemsWithTotal(items);
    const total = itemsTotal + getTransportationCost(normalizedShippingMethod);

    return {
        user,
        items: normalizedItems,
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        shippingMethod: normalizedShippingMethod,
        paymentMethod: paymentMethod.trim(),
        status: status || "pending",
        paymentStatus: paymentStatus || "pending",
        total
    };
};

export const validateUpdateOrderInput = async(body) => {
    const updatedData = {};

    if (body.items !== undefined) {
        const { normalizedItems, total } = await buildItemsWithTotal(body.items);
        updatedData.items = normalizedItems;
        updatedData.total = total;
    }

    if (body.shippingAddress !== undefined) {
        if (!body.shippingAddress.trim() || body.shippingAddress.trim().length < 10) {
            throw new AppError("La direccion de envio debe tener minimo 10 caracteres", 400);
        }

        updatedData.shippingAddress = body.shippingAddress.trim();
    }

    if (body.city !== undefined) {
        if (!body.city.trim() || body.city.trim().length < 2) {
            throw new AppError("La ciudad debe tener minimo 2 caracteres", 400);
        }

        updatedData.city = body.city.trim();
    }

    if (body.shippingMethod !== undefined) {
        const normalizedShippingMethod = body.shippingMethod.trim();

        if (!shippingMethodOptions.includes(normalizedShippingMethod)) {
            throw new AppError("Debes asignar un metodo de entrega valido", 400);
        }

        updatedData.shippingMethod = normalizedShippingMethod;
    }

    if (body.paymentMethod !== undefined) {
        if (!body.paymentMethod.trim()) {
            throw new AppError("El metodo de pago es obligatorio", 400);
        }

        updatedData.paymentMethod = body.paymentMethod.trim();
    }

    if (body.status !== undefined) {
        if (!OrderStatus.includes(body.status)) {
            throw new AppError("Debes asignar un estado de orden valido", 400);
        }

        updatedData.status = body.status;
    }

    if (body.paymentStatus !== undefined) {
        if (!PaymentStatus.includes(body.paymentStatus)) {
            throw new AppError("Debes asignar un estado de pago valido", 400);
        }

        updatedData.paymentStatus = body.paymentStatus;
    }

    if (Object.keys(updatedData).length === 0) {
        throw new AppError("Debes enviar al menos un campo valido para actualizar", 400);
    }

    return updatedData;
};
