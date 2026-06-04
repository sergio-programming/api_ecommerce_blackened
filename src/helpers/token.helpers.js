import jwt from 'jsonwebtoken';
import { requireEnv } from './validation.helpers.js';

export const generateTokens = (user) => {
    const SECRET_KEY = requireEnv('JWT_SECRET_KEY');
    const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    const REFRESH_SECRET_KEY = requireEnv('JWT_REFRESH_SECRET_KEY');
    const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


    const accessToken = jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        SECRET_KEY,
        { expiresIn: EXPIRES_IN }
    );

    const refreshAccessToken = jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET_KEY,
        { expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshAccessToken };
}
