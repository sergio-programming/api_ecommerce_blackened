import { AppError } from "../helpers/error.helpers.js";
import { hashPassword } from "../helpers/password.helpers.js";
import { generateTokens } from "../helpers/token.helpers.js";
import { authenticateUser, validateRegisterUserInput, verifyRefreshToken } from "../services/auth.services.js";
import { createUserService, getUserService } from "../services/user.services.js";

export const login = async(req, res, next) => {
    try {
        const user = await authenticateUser(req.body);

        const { accessToken, refreshAccessToken } = generateTokens(user);

        res.cookie('refreshToken', refreshAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            accessToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

export const register = async(req, res, next) => {
    try {
        const createdData = await validateRegisterUserInput(req.body);

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
}

export const logout = async(req, res, next) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        next(error);
    }
};

export const refreshAccessToken = async(req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            return next(new AppError(
                'No hay refresh token',
                401
            ));
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await getUserService(decoded.id);

        if (!user) {
            return next(new AppError(
                'Usuario no encontrado',
                404
            ));
        }

        if (!user.isActive) {
            return next(new AppError(
                'Usuario inactivo',
                403
            ));
        }

        const { accessToken, refreshAccessToken } = generateTokens({
            _id: user._id,
            email: user.email,
            role: user.role
        });

        res.cookie('refreshToken', refreshAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ accessToken });
    } catch (error) {
        next(error);
    }
};
