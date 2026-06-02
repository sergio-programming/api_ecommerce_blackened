import { User, UserRoles } from "../models/user.model.js";
import { AppError } from "../helpers/error.helpers.js";

export const getUsersService = async() => {
    return User.find().select('-password').sort({ createdAt: -1 }).lean().exec();
};

export const getUserService = async(id) => {
    return User.findById(id).lean().exec();
};

export const getUserByEmailService = async(email) => {
    return User.findOne({ email }).lean().exec();
};

export const getUserByRoleService = async(role) => {
    return (await User.find({ role }).select('-password')).sort({ createdAt: -1 }).lean().exec();
}

export const createUserService = async(body) => {
    const user = await User.create(body);
    return user.toObject();
};

export const updateUserService = async(id, body) => {
    return User.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: 'after' }
    )
    .lean()
    .exec();
};

export const deleteUserService = async(id) => {
    return User.findByIdAndDelete(id).lean().exec();
};

export const cancelUserService = async(id) => {
    return User.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { returnDocument: 'after' }
    )
    .lean()
    .exec();
};

export const activateUserService = async(id) => {
    return User.findByIdAndUpdate(
        id,
        { $set: { isActive: true } },
        { returnDocument: 'after' }
    )
    .lean()
    .exec();
};

export const validateCreateUserInput = async(body) => {
    const { fullName, email, password, role } = body;

    if (!fullName || !email || !password || !role) {
        throw new AppError('Los campos requeridos son obligatorios', 400);
    }

    if (fullName.trim().length < 3) {
        throw new AppError('El nombre debe tener mínimo 3 caracteres', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('El email debe tener un formato válido', 400);
    }

    if (password.trim().length < 8) {
        throw new AppError('La contraseña debe tener mínimo 8 caracteres', 400);
    }

    if (!UserRoles.includes(role)) {
        throw new AppError('Debe asignar un rol válido', 400)
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new AppError('Ya existe un usuario con ese email', 409);
    }
    return {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role
    }
};

export const validateUpdateUserInput = async(body) => {
    const updatedData = {};
    const allowedKeys = ['fullName', 'email', 'role', 'isActive'];

    Object.keys(body).forEach(key => {
        if (allowedKeys.includes(key)) {
            if (key === 'fullName') {
                updatedData[key] = body[key].trim();
            } else if (key === 'email') {
                updatedData[key] = body[key].toLowerCase();
            } else {
                updatedData[key] = body[key];
            }
        }
    });

    if (Object.keys(updatedData).length === 0) {
        throw new AppError('Debes enviar al menos un campo válido para actualizar')
    }

    if (updatedData.fullName && updatedData.fullName.length < 3) {
        throw new AppError('El nombre debe tener mínimo 3 caracteres', 400);
    }

    if (updatedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
        throw new AppError('El email debe tener un formato válido', 400);
    }

    if (updatedData.role && !UserRoles.includes(updatedData.role)) {
        throw new AppError('Debe asignar un rol válido', 400);
    }

    if (updatedData.isActive !== undefined && typeof updatedData.isActive !== "boolean") {
        throw new AppError('El valor debe ser booleano', 400);
    }

    return updatedData;
};

export const validateEditUserInfo = async(body) => {
    const reqData = {};
    const allowedKeys = ['fullName', 'email', 'password', 'confirmPassword'];

    Object.keys(body).forEach(key => {
        if (allowedKeys.includes(key) && body[key] !== undefined && body[key] !== null) {
            const value = String(body[key]).trim();

            if (value) {
                reqData[key] = key === 'email' ? value.toLowerCase() : value;
            }
        }
    });

    if (Object.keys(reqData).length === 0) {
        throw new AppError('Debes enviar al menos un campo válido para actualizar')
    }

    if (reqData.fullName && reqData.fullName.length < 3) {
        throw new AppError('El nombre debe tener mínimo 3 caracteres', 400);
    }

    if (reqData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reqData.email)) {
        throw new AppError('El email debe tener un formato válido', 400);
    }

    if (reqData.confirmPassword && !reqData.password) {
        throw new AppError('Debes enviar la contraseÃ±a para confirmar el cambio', 400);
    }

    if (reqData.password) {
        if (reqData.password.length < 8) {
            throw new AppError('La contraseña debe tener mínimo 8 caracteres', 400);
        }

        if (!reqData.confirmPassword) {
            throw new AppError('Debes confirmar la contraseña', 400);
        }

        if (reqData.confirmPassword !== reqData.password) {
            throw new AppError('Las contraseñas deben coincidir', 400);
        }  
    } 
    
    const { confirmPassword, ...updatedData } = reqData; 

    return updatedData;
}
