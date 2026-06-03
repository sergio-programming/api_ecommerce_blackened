import { Router } from "express";
import {
    getOrders,
    getOrder,
    getOrdersByUser,
    createOrder,
    updateOrder,
    deleteOrder
} from "../controllers/order.controller.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

export const orderRoutes = Router();

orderRoutes.get("/", verifyToken, verifyRole(["admin", "staff"]), getOrders);
orderRoutes.get("/user", verifyToken, verifyRole(["user"]), getOrdersByUser);
orderRoutes.get("/:id", verifyToken, verifyRole(["admin", "staff"]), getOrder);
orderRoutes.post("/", verifyToken, verifyRole(["user"]), createOrder);
orderRoutes.put("/:id", verifyToken, verifyRole(["admin", "staff"]), updateOrder);
orderRoutes.delete("/:id", verifyToken, verifyRole(["admin", "staff"]), deleteOrder);
