import { AppError } from "../helpers/error.helpers.js";
import {
    getOrdersService,
    getOrderService,
    getOrdersByUserService,
    createOrderService,
    updateOrderService,
    deleteOrderService,
    validateCreateOrderInput,
    validateUpdateOrderInput
} from "../services/order.services.js";

export const getOrders = async(req, res, next) => {
    try {
        const orders = await getOrdersService();
        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

export const getOrder = async(req, res, next) => {
    try {
        const { id } = req.params;
        const order = await getOrderService(id);

        if (!order) {
            return next(new AppError("Orden no encontrada", 404));
        }

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

export const getOrdersByUser = async(req, res, next) => {
    try {
        const { userId } = req.params;
        const orders = await getOrdersByUserService(userId);

        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

export const createOrder = async(req, res, next) => {
    try {
        const createdData = await validateCreateOrderInput(req.body);
        const newOrder = await createOrderService(createdData);

        res.status(201).json({
            message: "La orden se ha creado correctamente",
            order: newOrder
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrder = async(req, res, next) => {
    try {
        const { id } = req.params;
        const updatedData = await validateUpdateOrderInput(req.body);
        const updatedOrder = await updateOrderService(id, updatedData);

        if (!updatedOrder) {
            return next(new AppError("No se pudo actualizar: orden no encontrada", 404));
        }

        res.status(200).json({
            message: "La orden se ha actualizado correctamente",
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

export const deleteOrder = async(req, res, next) => {
    try {
        const { id } = req.params;
        const deletedOrder = await deleteOrderService(id);

        if (!deletedOrder) {
            return next(new AppError("No se pudo eliminar: orden no encontrada", 404));
        }

        res.status(200).json({
            message: "La orden se ha eliminado correctamente",
            order: deletedOrder
        });
    } catch (error) {
        next(error);
    }
};
