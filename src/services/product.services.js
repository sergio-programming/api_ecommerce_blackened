import { AppError } from "../helpers/error.helpers.js";
import { Product, ProductCategories, SizeTypes } from "../models/product.model.js";

const isValidCode = (code) => /^[A-Z]{3}-\d{4}$/.test(code);
const isMissing = (value) => value === undefined || value === null;
const normalizeText = (value) => typeof value === "string" ? value.trim() : value;

const validateInventoryByCategory = (category, inventory) => {
    if (!Array.isArray(inventory) || inventory.length === 0) {
        throw new AppError("El inventario no puede venir vacio", 400);
    }

    const normalizedInventory = inventory.map((item) => ({
        size: normalizeText(item?.size),
        stock: item?.stock
    }));

    if (category === "CD" && normalizedInventory.length !== 1) {
        throw new AppError("Los productos CD solo deben tener una entrada de inventario", 400);
    }

    const seenSizes = new Set();

    normalizedInventory.forEach((item) => {
        if (isMissing(item.stock) || typeof item.stock !== "number" || item.stock < 0) {
            throw new AppError("Dato invalido para el stock", 400);
        }

        if (category === "Camisetas" || category === "Buzos") {
            if (!item.size || !SizeTypes.includes(item.size)) {
                throw new AppError("Talla invalida", 400);
            }

            if (seenSizes.has(item.size)) {
                throw new AppError("No se permite duplicar tallas", 400);
            }

            seenSizes.add(item.size);
        }

        if (category === "CD" && item.size) {
            throw new AppError("No debes ingresar talla para los CD", 400);
        }
    });

    return normalizedInventory;
};

export const getProductsService = async() => {
    return Product.find().sort({ createdAt: -1 }).lean().exec();
};

export const getProductService = async(id) => {
    return Product.findById(id).lean().exec();
};

export const getProductByCodeService = async(productCode) => {
    return Product.findOne({ productCode }).lean().exec();
}

export const getProductByCategoryService = async(category) => {
    return Product.find({ category }).sort({ createdAt: -1 }).lean().exec();
};

export const createProductService = async(body) => {
    const product = await Product.create(body);
    return product.toObject();
};

export const updateProductService = async(id, body) => {
    return Product.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: 'after' }
    )
    .lean()
    .exec();
};

export const deleteProductService = async(id) => {
    return Product.findByIdAndDelete(id).lean().exec();
};

export const validateCreateProductInput = async(body) => {
    const { productCode, description, category, price, image, inventory } = body;

    if (
        isMissing(productCode) ||
        isMissing(description) ||
        isMissing(category) ||
        isMissing(price) ||
        isMissing(image) ||
        isMissing(inventory)
    ) {
        throw new AppError("Los campos requeridos son obligatorios", 400);
    }

    const trimmedCode = normalizeText(productCode);
    const trimmedDescription = normalizeText(description);
    const trimmedImage = normalizeText(image);

    if (!isValidCode(trimmedCode)) {
        throw new AppError("El codigo debe tener un formato valido", 400);
    }

    if (trimmedDescription.length < 10 || trimmedDescription.length > 100) {
        throw new AppError("La descripcion debe tener entre 10 y 100 caracteres", 400);
    }

    if (!ProductCategories.includes(category)) {
        throw new AppError("Debe seleccionar una categoria valida", 400);
    }

    if (typeof price !== "number" || price < 0) {
        throw new AppError("Dato invalido para el precio", 400);
    }

    const validatedInventory = validateInventoryByCategory(category, inventory);

    const productExists = await Product.findOne({ productCode: trimmedCode }).lean().exec();

    if (productExists) {
        throw new AppError("Ya existe un producto con este codigo", 409);
    }

    return {
        productCode: trimmedCode,
        description: trimmedDescription,
        category,
        price,
        image: trimmedImage,
        inventory: validatedInventory
    };
};

export const validateUpdateProductInput = async(id, body) => {
    const updatedData = {};
    const allowedKeys = [
        'productCode',
        'description',
        'category',
        'price',
        'image',
        'inventory'
    ];

    Object.keys(body).forEach((key) => {
        if (!allowedKeys.includes(key)) {
            return;
        }

        if (key === "productCode" || key === "description" || key === "image") {
            updatedData[key] = normalizeText(body[key]);
            return;
        }

        updatedData[key] = body[key];
    });

    if (Object.keys(updatedData).length === 0) {
        throw new AppError("Debes enviar al menos un campo valido para actualizar", 400);
    }

    if (updatedData.productCode && !isValidCode(updatedData.productCode)) {
        throw new AppError("El codigo debe tener un formato valido", 400);
    }

    if (
        updatedData.description &&
        (updatedData.description.length < 10 || updatedData.description.length > 100)
    ) {
        throw new AppError("La descripcion debe tener entre 10 y 100 caracteres", 400);
    }

    if (updatedData.category && !ProductCategories.includes(updatedData.category)) {
        throw new AppError("Debe seleccionar una categoria valida", 400);
    }

    if (!isMissing(updatedData.price) && (typeof updatedData.price !== "number" || updatedData.price < 0)) {
        throw new AppError("El precio no puede ser negativo", 400);
    }

    const currentProduct = await getProductService(id);

    if (!currentProduct) {
        throw new AppError("Producto no encontrado", 404);
    }

    const finalCategory = updatedData.category || currentProduct.category;

    if (updatedData.category && isMissing(updatedData.inventory)) {
        validateInventoryByCategory(finalCategory, currentProduct.inventory);
    }

    if (!isMissing(updatedData.inventory)) {
        updatedData.inventory = validateInventoryByCategory(finalCategory, updatedData.inventory);
    }

    if (updatedData.productCode) {
        const productByCode = await Product.findOne({ productCode: updatedData.productCode }).lean().exec();

        if (productByCode && productByCode._id.toString() !== id) {
            throw new AppError("Ya existe un producto con este codigo", 409);
        }
    }

    return updatedData;
};
