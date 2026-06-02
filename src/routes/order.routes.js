import { Router } from "express";
import {
    getOrders,
    getOrder,
    getOrdersByUser,
    createOrder,
    updateOrder,
    deleteOrder
} from "../controllers/order.controller.js";

export const orderRoutes = Router();

orderRoutes.get("/", getOrders);
orderRoutes.get("/user/:userId", getOrdersByUser);
orderRoutes.get("/:id", getOrder);
orderRoutes.post("/", createOrder);
orderRoutes.put("/:id", updateOrder);
orderRoutes.delete("/:id", deleteOrder);
