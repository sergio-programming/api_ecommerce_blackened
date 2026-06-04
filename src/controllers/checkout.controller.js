import { AppError } from "../helpers/error.helpers.js";
import { 
    getCheckoutByUserService,
    createCheckoutService,
    updateCheckoutService,
    deleteCheckoutService,
    validateCreateCheckoutInput,
    validateUpdateCheckoutInput,
    assertCheckoutBelongsToUser
} from "../services/checkout.services.js";

export const getCheckoutByUser = async(req, res, next) => {
    try {
        const checkout = await getCheckoutByUserService(req.user.id);

        if (!checkout) {
            return next(new AppError(
                'Checkout no encontrado',
                404
            ));
        }

        res.status(200).json(checkout);
    } catch (error) {
        next(error);
    }
};

export const createCheckout = async(req, res, next) => {
    try {
        const validatedData = await validateCreateCheckoutInput({
            ...req.body,
            user: req.user.id
        });

        const newCheckout = await createCheckoutService(validatedData);

        res.status(201).json({
            message: 'El checkout se ha creado correctamente',
            checkout: newCheckout
        });
    } catch (error) {
        next(error);
    }
};

export const updateCheckout = async(req, res, next) => {
    try {
        const { id, cartId } = req.params;

        await assertCheckoutBelongsToUser(id, req.user.id);
        const validatedData = await validateUpdateCheckoutInput(cartId, req.user.id, req.body);

        const updatedCheckout = await updateCheckoutService(id, validatedData);
        
        if (!updatedCheckout) {
            return next(new AppError(
                'No se pudo actualizar: checkout no encontrado',
                404
            ));
        }

        res.status(200).json({
            message: 'El checkout se ha actualizado correctamente',
            checkout: updatedCheckout
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCheckout = async(req, res, next) => {
    try {
        const { id } = req.params;

        await assertCheckoutBelongsToUser(id, req.user.id);
        const deletedCheckout = await deleteCheckoutService(id);

        if (!deletedCheckout) {
            return next(new AppError(
                'No se pudo eliminar: checkout no encontrado',
                404
            ));
        }

        res.status(200).json({
            message: 'El checkout se ha eliminado correctamente',
            checkout: deletedCheckout
        });
    } catch (error) {
        next(error);
    }
}
