import mongoose from "mongoose";
import { AppError } from "./error.helpers.js";

export const ensureValidObjectId = (id, fieldName = "id") => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`${fieldName} invalido`, 400);
    }

    return id;
};

export const requireEnv = (key) => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Variable de entorno requerida no configurada: ${key}`);
    }

    return value;
};

export const normalizeText = (value) => typeof value === "string" ? value.trim() : value;

export const isMissing = (value) => value === undefined || value === null;

export const isTenDigitPhone = (value) => /^\d{10}$/.test(String(value));
