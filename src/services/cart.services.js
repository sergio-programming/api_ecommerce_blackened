import { AppError } from "../helpers/error.helpers.js";
import { ensureValidObjectId } from "../helpers/validation.helpers.js";
import { Cart } from "../models/cart.model.js";
import { Product, SizeTypes } from "../models/product.model.js";
import { User } from "../models/user.model.js";

const buildItemsWithTotal = async(items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError("Debes enviar al menos un producto en el carrito", 400);
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

        const requiresSize = product.category === "Camisetas" || product.category === "Buzos";
        let selectedInventory = product.inventory?.[0];
        const priceAtMoment = product.price;
        const normalizedItem = {
            product: product._id,
            quantity: item.quantity,
            priceAtMoment
        };

        if (requiresSize) {
            if (!item.size || !SizeTypes.includes(item.size)) {
                throw new AppError("Debe seleccionar una talla valida", 400);
            }

            selectedInventory = product.inventory.find((element) => element.size === item.size);

            if (!selectedInventory) {
                throw new AppError("La talla seleccionada no esta disponible para este producto", 400);
            }

            normalizedItem.size = item.size;
        } else if (item.size) {
            throw new AppError("Este producto no requiere talla", 400);
        }

        const stockKey = `${product._id.toString()}:${normalizedItem.size || "default"}`;
        const requestedQuantity = (requestedByProductAndSize.get(stockKey) || 0) + quantity;
        requestedByProductAndSize.set(stockKey, requestedQuantity);

        if (!selectedInventory || selectedInventory.stock < requestedQuantity) {
            throw new AppError("Stock insuficiente para uno de los productos", 400);
        }

        normalizedItem.quantity = quantity;
        total += priceAtMoment * quantity;

        normalizedItems.push(normalizedItem);
    }

    return { normalizedItems, total };
};

const getPopulatedCart = async(cartId) => {
    return Cart.findById(cartId)
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const getCartsService = async() => {
    return Cart.find()
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .sort({ createdAt: -1 })
        .lean()
        .exec();
};

export const getCartService = async(id) => {
    ensureValidObjectId(id);

    return Cart.findById(id)
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const getCartByUserService = async(userId) => {
    ensureValidObjectId(userId, "usuario");

    return Cart.findOne({ user: userId })
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const createCartService = async(body) => {
    const cart = await Cart.create(body);
    return cart.toObject();
};

export const updateCartService = async(id, body) => {
    ensureValidObjectId(id);

    return Cart.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after', runValidators: true })
        .populate("user", "fullName email role")
        .populate("items.product", "productCode description price image")
        .lean()
        .exec();
};

export const deleteCartService = async(id) => {
    ensureValidObjectId(id);

    return Cart.findByIdAndDelete(id).lean().exec();
};

export const assertCartBelongsToUser = async(cartId, userId) => {
    ensureValidObjectId(cartId);
    ensureValidObjectId(userId, "usuario");

    const cart = await Cart.findOne({ _id: cartId, user: userId }).select("_id").lean().exec();

    if (!cart) {
        throw new AppError("Carrito no encontrado para este usuario", 404);
    }
};

export const validateCreateCartInput = async(body) => {
    const { user, items } = body;

    if (!user || !items) {
        throw new AppError("Los campos requeridos son obligatorios", 400);
    }

    const existingUser = await User.findById(user).lean().exec();

    if (!existingUser) {
        throw new AppError("Usuario no encontrado", 404);
    }

    const existingCart = await Cart.findOne({ user }).lean().exec();

    if (existingCart) {
        throw new AppError("El usuario ya tiene un carrito creado", 409);
    }

    const { normalizedItems, total } = await buildItemsWithTotal(items);

    return {
        user,
        items: normalizedItems,
        total
    };
};

export const validateUpdateCartInput = async(body) => {
    const updatedData = {};

    if (body.items !== undefined) {
        const { normalizedItems, total } = await buildItemsWithTotal(body.items);
        updatedData.items = normalizedItems;
        updatedData.total = total;
    }

    if (Object.keys(updatedData).length === 0) {
        throw new AppError("Debes enviar al menos un campo valido para actualizar", 400);
    }

    return updatedData;
};

export const updateCartItemService = async(cartId, itemId, quantity) => {
    ensureValidObjectId(cartId);
    ensureValidObjectId(itemId, "item");

    const cart = await Cart.findById(cartId);

    if (!cart) {
         return null;
    }

    const item = cart.items.find(item => item._id.toString() === itemId);

    if (!item) {
        throw new AppError("Item no encontrado en el carrito", 404);
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        throw new AppError("La cantidad debe ser mayor o igual a 1", 400);
    }

    const product = await Product.findById(item.product).lean().exec();

    if (!product) {
        throw new AppError("El producto del item no existe", 404);
    }

    const requiresSize = product.category === 'Camisetas' || product.category === 'Buzos';
    let selectedInventory = product.inventory[0];

    if (requiresSize) {
        selectedInventory = product.inventory.find(element => element.size === item.size);
    }

    if (!selectedInventory || selectedInventory.stock < parsedQuantity) {
        throw new AppError("Stock insuficiente para uno de los productos", 400);
    }

    cart.items.forEach((item) => {
        if (item._id.toString() === itemId) {
            item.quantity = parsedQuantity;
        }
    });

    cart.total = cart.items.reduce(
        (sum, item) => sum + item.priceAtMoment * item.quantity,
        0
    );

    await cart.save();

    return getPopulatedCart(cartId);
}

export const deleteCartItemService = async(cartId, itemId) => {
    ensureValidObjectId(cartId);
    ensureValidObjectId(itemId, "item");

    const cart = await Cart.findById(cartId);

    if (!cart) {
        return null;
    }

    const initialItemsLength = cart.items.length;
    cart.items = cart.items.filter(
        (item) => item._id.toString() !== itemId
    );

    if (cart.items.length === initialItemsLength) {
        throw new AppError("Item no encontrado en el carrito", 404);
    }

    cart.total = cart.items.reduce(
        (sum, item) => sum + item.priceAtMoment * item.quantity,
        0
    );

    await cart.save();

    return getPopulatedCart(cartId);
};
