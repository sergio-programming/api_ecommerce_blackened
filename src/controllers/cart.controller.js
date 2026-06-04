import { AppError } from "../helpers/error.helpers.js";
import mongoose from "mongoose";
import {
    getCartsService,
    getCartService,
    getCartByUserService,
    createCartService,
    updateCartService,
    deleteCartService,
    validateCreateCartInput,
    validateUpdateCartInput,
    deleteCartItemService,
    updateCartItemService,
    assertCartBelongsToUser
} from "../services/cart.services.js";


export const getCarts = async(req, res, next) => {
    try {
        const carts = await getCartsService();
        res.status(200).json(carts);
    } catch (error) {
        next(error);
    }
};

export const getCart = async(req, res, next) => {
    try {
        const { id } = req.params;
        const cart = await getCartService(id);

        if (!cart) {
            return next(new AppError("Carrito no encontrado", 404));
        }

        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

export const getCartByUser = async(req, res, next) => {
    try {
        const cart = await getCartByUserService(req.user.id);

        if (!cart) {
            return next(new AppError("Carrito no encontrado para este usuario", 404));
        }

        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

export const createCart = async(req, res, next) => {
    try {
        const createdData = await validateCreateCartInput({
            ...req.body,
            user: req.user.id
        });
        const newCart = await createCartService(createdData);

        res.status(201).json({
            message: "El carrito se ha creado correctamente",
            cart: newCart
        });
    } catch (error) {
        next(error);
    }
};

export const updateCart = async(req, res, next) => {
    try {
        const { id } = req.params;
        await assertCartBelongsToUser(id, req.user.id);
        const updatedData = await validateUpdateCartInput(req.body);
        const updatedCart = await updateCartService(id, updatedData);

        if (!updatedCart) {
            return next(new AppError("No se pudo actualizar: carrito no encontrado", 404));
        }

        res.status(200).json({
            message: "El carrito se ha actualizado correctamente",
            cart: updatedCart
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCart = async(req, res, next) => {
    try {
        const { id } = req.params;
        await assertCartBelongsToUser(id, req.user.id);
        const deletedCart = await deleteCartService(id);

        if (!deletedCart) {
            return next(new AppError("No se pudo eliminar: carrito no encontrado", 404));
        }

        res.status(200).json({
            message: "El carrito se ha eliminado correctamente",
            cart: deletedCart
        });
    } catch (error) {
        next(error);
    }
};

export const updateCartItem = async(req, res, next) => {
    try {
        const { id, itemId } = req.params;
        const { quantity } = req.body;

        await assertCartBelongsToUser(id, req.user.id);
        const updatedCart = await updateCartItemService(id, itemId, quantity);

        if (!updatedCart) {
            return next(new AppError("No se pudo actualizar el item: carrito no encontrado", 404));
        }

        res.status(200).json({
            message: 'El item del carrito se ha actualizado exitosamente',
            cart: updatedCart
        })
    } catch (error) {
        next(error);
    }
}

export const deleteCartItem = async(req, res, next) => {
    try {
        const { id, itemId } = req.params;
        await assertCartBelongsToUser(id, req.user.id);
        const updatedCart = await deleteCartItemService(id, itemId);
        
        if (!updatedCart) {
            return next(new AppError("No se pudo eliminar el item: carrito no encontrado", 404));
        }

        res.status(200).json({
            message: 'El item del carrito se ha eliminado exitosamente',
            cart: updatedCart
        })
    } catch (error) {
        next(error);
    }
};
