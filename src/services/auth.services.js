import jwt from 'jsonwebtoken';
import { AppError } from "../helpers/error.helpers.js";
import { getUserByEmailService } from "./user.services.js";
import { comparePassword } from "../helpers/password.helpers.js";
import { User } from '../models/user.model.js';
import { requireEnv } from "../helpers/validation.helpers.js";

export const authenticateUser = async(body) => {
    const payload = {};

    Object.keys(body).forEach(key => {
        if (typeof body[key] !== 'string') {
            payload[key] = body[key];
            return;
        }

        if (key === 'email') {
            payload[key] = body[key].trim().toLowerCase();
        } else {
            payload[key] = body[key].trim();
        }
    });

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new AppError('El email es requerido y debe tener un formato válido', 400);
    }

    if (!payload.password || payload.password.length < 8) {
        throw new AppError('El password es requerido y debe tener una longitud válida', 400);
    }

    const user = await getUserByEmailService(payload.email);

    if (!user) {
        throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.isActive) {
        throw new AppError('Usuario inactivo', 403);
    }

    const validPassword = await comparePassword(payload.password, user.password);

    if (!validPassword) {
        throw new AppError('Credenciales inválidas', 401);
    }

    return user;
};

export const validateRegisterUserInput = async(body) => {
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
        throw new AppError('Todos los campos son requeridos', 400);
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

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        throw new AppError('Ya existe un usuario con ese email', 409);
    }

    return {
        fullName: fullName.trim(),
        email: normalizedEmail,
        password: password.trim(),
        role: 'user'
    }
};

export const verifyRefreshToken = (token) => {
    try {
        const REFRESH_SECRET_KEY = requireEnv('JWT_REFRESH_SECRET_KEY');
        const decoded = jwt.verify(token, REFRESH_SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new AppError('Refresh token inválido o expirado', 403);
    }
};
