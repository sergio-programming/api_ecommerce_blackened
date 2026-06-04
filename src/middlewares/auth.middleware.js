import jwt from 'jsonwebtoken';
import { AppError } from '../helpers/error.helpers.js';
import { requireEnv } from '../helpers/validation.helpers.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('Token no proporcionado', 401);
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            throw new AppError('Formato de token invalido', 401);
        }

        const SECRET_KEY = requireEnv('JWT_SECRET_KEY');
        const decoded = jwt.verify(token, SECRET_KEY);

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expirado', 401));
        }

        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Token invalido', 401));
        }

        next(error);
    }
};

export const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const roles = allowedRoles.flat();

            if (!req.user) {
                throw new AppError('Usuario no autenticado', 401);
            }

            if (!req.user.role) {
                throw new AppError('Rol de usuario no encontrado', 403);
            }

            if (!roles.includes(req.user.role)) {
                throw new AppError('No tienes permisos para realizar esta accion', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const isAdmin = verifyRole('admin');
