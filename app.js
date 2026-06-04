import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectToDatabase } from './src/core/db.js';
import { errorHandler } from './src/middlewares/error.middleware.js';
import { authRoutes } from './src/routes/auth.routes.js';
import { cartRoutes } from './src/routes/cart.routes.js';
import { orderRoutes } from './src/routes/order.routes.js';
import { userRoutes } from './src/routes/user.routes.js';
import { productRoutes } from './src/routes/product.routes.js';
import { checkoutRoutes } from './src/routes/checkout.routes.js';

const app = express();

dotenv.config();

const configuredOrigins = process.env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = configuredOrigins?.length ? configuredOrigins : [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
];

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkouts', checkoutRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);            
        });
    })
    .catch((error) => {
        console.error('No se pudo conectar con MongoDB: ' , error);
        process.exit(1)
    });
