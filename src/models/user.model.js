import mongoose from "mongoose";

export const UserRoles = ['admin', 'staff', 'user'];

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true, minlength: 8 },
    role: { type: String, required: true, enum: UserRoles, default: 'user' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);