import mongoose from "mongoose";
import { requireEnv } from "../helpers/validation.helpers.js";

export const connectToDatabase = async() => {
    const mongoUrl = requireEnv("MONGO_URI");

    // Listeners para tener el status de la conexión
    mongoose.connection.on('connected', () => console.log('Conectado a MongoDB'));
    mongoose.connection.on('error', (err) => console.error('Error de conexión a MongoDB: ', err));
    mongoose.connection.on('disconnected', () => console.warn('Desconectado a MongoDB'));

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection.asPromise();
    }

    return mongoose.connect(mongoUrl, {
        autoIndex: process.env.NODE_ENV !== "production",
        maxPoolSize: 10,
    })

}
