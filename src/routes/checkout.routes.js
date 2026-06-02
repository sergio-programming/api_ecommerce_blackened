import { Router } from "express";
import {
    getCheckoutByUser,
    createCheckout,
    updateCheckout,
    deleteCheckout
} from "../controllers/checkout.controller.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

export const checkoutRoutes = Router();

checkoutRoutes.get("/user", verifyToken, verifyRole(["user"]), getCheckoutByUser);
checkoutRoutes.post("/", verifyToken, verifyRole(["user"]), createCheckout);
checkoutRoutes.put("/:id/cart/:cartId", verifyToken, verifyRole(["user"]), updateCheckout);
checkoutRoutes.delete("/:id", verifyToken, verifyRole(["user"]), deleteCheckout);
