import { User, UserRoles } from "../models/user.model.js";
import { AppError } from "../helpers/error.helpers.js";
import { ensureValidObjectId } from "../helpers/validation.helpers.js";

export const getUsersService = async() => {
    return User.find().select('-password').sort({ createdAt: -1 }).lean().exec();
};

export const getUserService = async(id) => {
    ensureValidObjectId(id, "usuario");

    return User.findById(id).lean().exec();
};

export const getUserByEmailService = async(email) => {
    return User.findOne({ email }).lean().exec();
};

export const getUserByRoleService = async(role) => {
    if (!UserRoles.includes(role)) {
        throw new AppError("Debe asignar un rol valido", 400);
    }

    return User.find({ role }).select('-password').sort({ createdAt: -1 }).lean().exec();
}

export const createUserService = async(body) => {
    const user = await User.create(body);
    return user.toObject();
};

export const updateUserService = async(id, body) => {
    ensureValidObjectId(id, "usuario");

    return User.findByIdAndUpdate(
        id,
        { $set: body },
        { returnDocument: 'after', runValidators: true }
    )
    .lean()
    .exec();
};

export const deleteUserService = async(id) => {
    ensureValidObjectId(id, "usuario");

    return User.findByIdAndDelete(id).lean().exec();
};

export const cancelUserService = async(id) => {
    ensureValidObjectId(id, "usuario");

    return User.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { returnDocument: 'after', runValidators: true }
    )
    .lean()
    .exec();
};

export const activateUserService = async(id) => {
    ensureValidObjectId(id, "usuario");

    return User.findByIdAndUpdate(
        id,
        { $set: { isActive: true } },
        { returnDocument: 'after', runValidators: true }
    )
    .lean()
    .exec();
};

export const validateCreateUserInput = async(body) => {
    const { fullName, email, password, role, documentNumber } = body;

    if (!fullName || !email || !password || !role || !documentNumber) {
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

    if (documentNumber.trim().length < 6 || documentNumber.trim().length > 10) {
        throw new AppError('El numero de documento debe tener una longitud valida', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        throw new AppError('Ya existe un usuario con ese email', 409);
    }
    return {
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
        role,
        documentNumber: documentNumber.trim()
    }
};

export const validateUpdateUserInput = async(body) => {
    const updatedData = {};
    const allowedKeys = ['fullName', 'email', 'role', 'isActive', 'documentNumber'];

    Object.keys(body).forEach(key => {
        if (allowedKeys.includes(key)) {
            if (key === 'fullName') {
                updatedData[key] = body[key].trim();
            } else if (key === 'email') {
                updatedData[key] = body[key].trim().toLowerCase();
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

    if (updatedData.documentNumber && (updatedData.documentNumber.length < 6 || updatedData.documentNumber.length >  10 )) {
        throw new AppError('El número de documento debe tener una longitud válida', 400);
    }

    return updatedData;
};

export const validateUpdateUserDocumentNumber = async(body) => {
    const documentNumber = body.documentNumber?.trim();

    if (!documentNumber) {
        throw new AppError('El numero de documento es obligatorio', 400);
    }

    if (documentNumber.length < 6 || documentNumber.length > 10) {
        throw new AppError('El numero de documento debe tener una longitud valida', 400);
    }

    return { documentNumber };
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
