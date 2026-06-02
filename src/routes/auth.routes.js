import { Router } from "express";
import { login, logout, refreshAccessToken, register } from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.post('/refresh', refreshAccessToken);
