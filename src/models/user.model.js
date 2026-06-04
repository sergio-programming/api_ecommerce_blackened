import mongoose from "mongoose";

export const UserRoles = ['admin', 'staff', 'user'];

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: String, required: true, trim: true, minlength: 8 },
    role: { type: String, required: true, enum: UserRoles, default: 'user' },
    isActive: { type: Boolean, default: true },
    documentNumber: { type: String, trim: true, minlength: 6, maxlength: 10 }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
