import { AppError } from "../helpers/error.helpers.js";
import { ensureValidObjectId, isTenDigitPhone } from "../helpers/validation.helpers.js";
import { paymentMethodOptions, shippingMethodOptions } from "../models/checkout.model.js";
import { Order, OrderStatus, PaymentStatus } from "../models/order.model.js";
import { Product, SizeTypes } from "../models/product.model.js";
import { User } from "../models/user.model.js";

const getSelectedInventory = (product, item) => {
    const requiresSize = product.category === "Camisetas" || product.category === "Buzos";

    if (requiresSize) {
        if (!item.size || !SizeTypes.includes(item.size)) {
            throw new AppError("Debe seleccionar una talla valida", 400);
        }

        const inventoryIndex = product.inventory.findIndex((element) => element.size === item.size);

        if (inventoryIndex === -1) {
            throw new AppError("La talla seleccionada no esta disponible para este producto", 400);
        }

        return { selectedInventory: product.inventory[inventoryIndex], inventoryIndex };
    }

    if (item.size) {
        throw new AppError("Este producto no requiere talla", 400);
    }

    return { selectedInventory: product.inventory?.[0], inventoryIndex: 0 };
};

const buildItemsWithTotal = async(items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError("Debes enviar al menos un producto en la orden", 400);
    }

    const normalizedItems = [];
    let total = 0;
    const requestedByProductAndSize = new Map();

    for (const item of items) {
        if (!item.product || !item.quantity) {
            throw new AppError("Cada item debe incluir producto y cantidad", 400);
        }

        ensureValidObjectId(item.product, "producto");

        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new AppError("La cantidad debe ser mayor o igual a 1", 400);
        }

        const product = await Product.findById(item.product).lean().exec();

        if (!product) {
            throw new AppError("Uno de los productos no existe", 404);
        }

        const { selectedInventory } = getSelectedInventory(product, item);

        const stockKey = `${product._id.toString()}:${item.size || "default"}`;
        const requestedQuantity = (requestedByProductAndSize.get(stockKey) || 0) + quantity;
        requestedByProductAndSize.set(stockKey, requestedQuantity);

        if (!selectedInventory || selectedInventory.stock < requestedQuantity) {
            throw new AppError("Stock insuficiente para uno de los productos", 400);
        }

        const priceAtMoment = product.price;
        total += priceAtMoment * quantity;

        normalizedItems.push({
            product: product._id,
            size: item.size,
            quantity,
            priceAtMoment
        });
    }

    return { normalizedItems, total };
};

const discountProductInventory = async(items) => {
    const appliedDiscounts = [];

    for (const item of items) {
        try {
            const product = await Product.findById(item.product).lean().exec();

            if (!product) {
                throw new AppError("Uno de los productos no existe", 404);
            }

            const { inventoryIndex } = getSelectedInventory(product, item);
            const stockPath = `inventory.${inventoryIndex}.stock`;

            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    [stockPath]: { $gte: item.quantity }
                },
                {
                    $inc: { [stockPath]: -item.quantity }
                },
                { returnDocument: "after" }
            )
                .lean()
                .exec();

            if (!updatedProduct) {
                throw new AppError("Stock insuficiente para uno de los productos", 400);
            }

            appliedDiscounts.push({
                product: item.product,
                stockPath,
                quantity: item.quantity
            });
        } catch (error) {
            await restoreProductInventory(appliedDiscounts);
            throw error;
        }
    }

    return appliedDiscounts;
};

const restoreProductInventory = async(discounts) => {
    for (const discount of discounts.reverse()) {
        await Product.findByIdAndUpdate(
            discount.product,
            { $inc: { [discount.stockPath]: discount.quantity } }
        ).exec();
    }
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
    ensureValidObjectId(id);

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
    const appliedDiscounts = await discountProductInventory(body.items);

    try {
        const order = await Order.create(body);
        return order.toObject();
    } catch (error) {
        await restoreProductInventory(appliedDiscounts);
        throw error;
    }
};

export const updateOrderService = async(id, body) => {
    ensureValidObjectId(id);

    return Order.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after', runValidators: true })
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const deleteOrderService = async(id) => {
    ensureValidObjectId(id);

    return Order.findByIdAndDelete(id).lean().exec();
};

export const validateCreateOrderInput = async(body) => {
    const { user, items, shippingAddress, city, phoneNumber, shippingMethod, paymentMethod } = body;

    if (!user || !items || !shippingAddress || !city || !phoneNumber || !shippingMethod || !paymentMethod) {
        throw new AppError("Los campos requeridos son obligatorios", 400);
    }

    ensureValidObjectId(user, "usuario");

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

    if (!isTenDigitPhone(phoneNumber.trim())) {
        throw new AppError("El numero telefonico debe tener 10 digitos", 400);
    }

    const normalizedShippingMethod = shippingMethod.trim();

    if (!shippingMethodOptions.includes(normalizedShippingMethod)) {
        throw new AppError("Debes asignar un metodo de entrega valido", 400);
    }

    const normalizedPaymentMethod = paymentMethod.trim();

    if (!paymentMethodOptions.includes(normalizedPaymentMethod)) {
        throw new AppError("Debes asignar un metodo de pago valido", 400);
    }

    const { normalizedItems, total: itemsTotal } = await buildItemsWithTotal(items);
    const total = itemsTotal + getTransportationCost(normalizedShippingMethod);

    return {
        user,
        items: normalizedItems,
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        phoneNumber: phoneNumber.trim(),
        shippingMethod: normalizedShippingMethod,
        paymentMethod: normalizedPaymentMethod,
        status: "Pendiente",
        paymentStatus: "Pendiente",
        total
    };
};

export const validateUpdateOrderInput = async(body) => {
    const updatedData = {};

    if (body.items !== undefined) {
        throw new AppError("No se permite actualizar items de una orden existente", 400);
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

    if (body.phoneNumber !== undefined) {
        if (!body.phoneNumber.trim() || !isTenDigitPhone(body.phoneNumber.trim())) {
            throw new AppError("El numero telefonico debe tener 10 digitos", 400);
        }

        updatedData.phoneNumber = body.phoneNumber.trim();
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

        const normalizedPaymentMethod = body.paymentMethod.trim();

        if (!paymentMethodOptions.includes(normalizedPaymentMethod)) {
            throw new AppError("Debes asignar un metodo de pago valido", 400);
        }

        updatedData.paymentMethod = normalizedPaymentMethod;
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
