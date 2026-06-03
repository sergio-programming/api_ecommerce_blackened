import { Router } from "express";
import { 
    getUsers,
    getUser,
    getUsersByRole,
    createUser,
    updateUser,
    deleteUser,
    activateUser,
    cancelUser,
    getUserProfile,
    editUserInfo,
    updateUserDocumentNumber
} from "../controllers/user.controller.js";
import { isAdmin, verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

export const userRoutes = Router();

userRoutes.get('/', verifyToken, isAdmin, getUsers);
userRoutes.get('/role/:role', verifyToken, isAdmin, getUsersByRole);
userRoutes.get('/me', verifyToken, verifyRole(['admin', 'staff', 'user']), getUserProfile)
userRoutes.put('/me', verifyToken, verifyRole(['user']), editUserInfo);
userRoutes.patch('/me/document-number', verifyToken, verifyRole(['user']), updateUserDocumentNumber);
userRoutes.get('/:id', verifyToken, isAdmin, getUser);
userRoutes.post('/', verifyToken, isAdmin, createUser);
userRoutes.put('/:id', verifyToken, isAdmin, updateUser);
userRoutes.patch('/:id/cancel', verifyToken, isAdmin, cancelUser);
userRoutes.patch('/:id/activate', verifyToken, isAdmin, activateUser)
userRoutes.delete('/:id', verifyToken, isAdmin, deleteUser);
