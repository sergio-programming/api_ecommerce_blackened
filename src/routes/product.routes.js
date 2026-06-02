import { Router } from "express";
import { 
    getProducts,
    getProduct,
    getProductsByCategory,
    getProductByCode,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/product.controller.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

export const productRoutes = Router();

productRoutes.get('/', verifyToken, verifyRole(['admin', 'staff']), getProducts);
productRoutes.get('/category/:category', getProductsByCategory)
productRoutes.get('/code/:productCode', getProductByCode);
productRoutes.get('/:id', verifyToken, verifyRole(['admin', 'staff']), getProduct);
productRoutes.post('/', verifyToken, verifyRole(['admin', 'staff']), createProduct);
productRoutes.put('/:id', verifyToken, verifyRole(['admin', 'staff']), updateProduct);
productRoutes.delete('/:id', verifyToken, verifyRole(['admin', 'staff']), deleteProduct);
