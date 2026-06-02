import { Router } from "express";
import {
    getCarts,
    getCart,
    getCartByUser,
    createCart,
    updateCart,
    deleteCart,
    deleteCartItem,
    updateCartItem
} from "../controllers/cart.controller.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

export const cartRoutes = Router();

cartRoutes.get("/", verifyToken, verifyRole(['admin', 'staff']), getCarts);
cartRoutes.get("/user", verifyToken, getCartByUser);
cartRoutes.get("/:id", verifyToken, verifyRole(['admin', 'staff']), getCart);
cartRoutes.post("/", verifyToken, verifyRole(['user']), createCart);
cartRoutes.put("/:id", verifyToken, verifyRole(['user']), updateCart);
cartRoutes.put("/:id/items/:itemId", verifyToken, verifyRole(['user']), updateCartItem);
cartRoutes.delete("/:id", verifyToken, verifyRole(['user']), deleteCart);
cartRoutes.delete("/:id/items/:itemId", verifyToken, verifyRole(['user']), deleteCartItem);
