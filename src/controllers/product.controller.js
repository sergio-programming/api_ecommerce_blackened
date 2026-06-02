import { AppError } from "../helpers/error.helpers.js";
import {
    getProductsService,
    getProductService,
    getProductByCategoryService,
    createProductService,
    updateProductService,
    deleteProductService,
    validateCreateProductInput,
    validateUpdateProductInput,
    getProductByCodeService
} from '../services/product.services.js';

export const getProducts = async(req, res, next) => {
    try {
        const products = await getProductsService();

        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

export const getProduct = async(req, res, next) => {
    try {
        const { id } = req.params;
        const product = await getProductService(id);

        if (!product) {
            return next(new AppError(
                'Producto no encontrado',
                404
            ));
        }

        res.status(200).json(product);

    } catch (error) {
        next(error);
    }
};

export const getProductsByCategory = async(req, res, next) => {
    try {
        const { category } = req.params;

        const products = await getProductByCategoryService(category);

        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

export const getProductByCode = async(req, res, next) => {
    try {
        const { productCode } = req.params;

        const product = await getProductByCodeService(productCode);

        if (!product) {
            return next(new AppError(
                'Producto no encontrado',
                404
            ));
        }

        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
}

export const createProduct = async(req, res, next) => {
    try {
        const createdData = await validateCreateProductInput(req.body);

        const newProduct = await createProductService(createdData);

        res.status(201).json({
            message: 'El producto se ha creado correctamente',
            product: newProduct
        });

    } catch (error) {
        next(error);
    }
};

export const updateProduct = async(req, res, next) => {
    try {
        const { id } = req.params;

        const updatedData = await validateUpdateProductInput(id, req.body);

        const updatedProduct = await updateProductService(id, updatedData);

        if (!updatedProduct) {
            return next(new AppError(
                'No se pudo actualizar: producto no encontrado',
                404
            ));
        }

        res.status(200).json({
            message: 'El producto se ha actualizado correctamente',
            product: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async(req, res, next) => {
    try {
        const { id } = req.params;

        const deletedProduct = await deleteProductService(id);

        if (!deletedProduct) {
            return next(new AppError(
                'No se pudo eliminar: producto no encontrado',
                404
            ));
        }

        res.status(200).json({
            message: 'El producto se ha eliminado correctamente',
            product: deletedProduct
        })
    } catch (error) {
        next(error);
    }
};
