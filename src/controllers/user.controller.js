import { AppError } from "../helpers/error.helpers.js";
import { hashPassword } from "../helpers/password.helpers.js";
import { 
    getUsersService,
    getUserService,
    createUserService,
    updateUserService,
    deleteUserService,
    cancelUserService,
    activateUserService,
    validateCreateUserInput,
    validateUpdateUserInput,
    getUserByRoleService,
    validateEditUserInfo
} from "../services/user.services.js";

export const getUsers = async(req, res, next) => {
    try {
        const users = await getUsersService();

        res.status(200).json(users);    
    } catch (error) {
        next(error);
    }
};

export const getUser = async(req, res, next) => {
    try {
        const { id } = req.params;
        const user = await getUserService(id);

        if (!user) {
            return next(new AppError(
                'Usuario no encontrado',
                404
            ));
        }
        const { password:_, ...userResponse } = user;
        res.status(200).json(userResponse);
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async(req, res, next) => {
    try {
        const currentUser = await getUserService(req.user.id);
        
        if (!currentUser) {
            return next(new AppError(
                'Usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = currentUser;
        res.status(200).json(userResponse);

    } catch (error) {
        next(error);
    }
}

export const getUsersByRole = async(req, res, next) => {
    try {
        const { role } = req.params;
        const users = await getUserByRoleService(role);

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const createUser = async(req, res, next) => {
    try {
        const createdData = await validateCreateUserInput(req.body);
        
        const hashedPassword = await hashPassword(createdData.password);

        const newUser = await createUserService({
            ...createdData,
            password: hashedPassword
        });

        const { password:_, ...userResponse } = newUser;
        res.status(201).json({
            message: 'El usuario se ha creado correctamente',
            user: userResponse
        });
        
    } catch (error) {
        next(error);
    }  
};

export const updateUser = async(req, res, next) => {
    try {
        const { id } = req.params;
        const updatedData = await validateUpdateUserInput(req.body);

        const updatedUser = await updateUserService(id, updatedData);

        if (!updatedUser) {
            return next(new AppError(
                'No se pudo actualizar: usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = updatedUser;
        res.status(200).json({
            message: 'El usuario se ha actualizado correctamente',
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
};

export const editUserInfo = async(req, res, next) => {
    try {
        const validatedData = await validateEditUserInfo(req.body);
        const dataToUpdate = { ...validatedData };

        if (dataToUpdate.password) {
            dataToUpdate.password = await hashPassword(dataToUpdate.password);
        }

        const updatedUser = await updateUserService(req.user.id, dataToUpdate);

        if (!updatedUser) {
            return next(new AppError(
                'No se pudo actualizar: usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = updatedUser;
        res.status(200).json({
            message: 'El usuario se ha actualizado correctamente',
            user: userResponse
        })
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async(req, res, next) => {
    try {
        const { id } = req.params;

        const deletedUser = await deleteUserService(id);

        if (!deletedUser) {
            return next(new AppError(
                'No se pudo eliminar: usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = deletedUser;
        res.status(200).json({
            message: 'El usuario se ha eliminado correctamente',
            user: userResponse
        })

    } catch (error) {
        next(error);
    }
};

export const cancelUser = async(req, res, next) => {
    try {
        const { id } = req.params;

        const cancelledUser = await cancelUserService(id);

        if (!cancelledUser) {
            return next(new AppError(
                'No se pudo cancelar: usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = cancelledUser;

        res.status(200).json({
            message: 'El usuario se ha cancelado correctamente',
            user: userResponse
        })

    } catch (error) {
        next(error);
    }
};

export const activateUser = async(req, res, next) => {
    try {
        const { id } = req.params;

        const activatedUser = await activateUserService(id);

        if (!activatedUser) {
            return next(new AppError(
                'No se pudo activar: usuario no encontrado',
                404
            ));
        }

        const { password:_, ...userResponse } = activatedUser;

        res.status(200).json({
            message: 'El usuario se ha activado correctamente',
            user: userResponse
        })

    } catch (error) {
        next(error);
    }
};
