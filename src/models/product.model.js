import mongoose from "mongoose";

export const ProductCategories = ['Camisetas', 'Buzos', 'CD'];
export const SizeTypes = ['S', 'M', 'L', 'XL'];

const productSchema = new mongoose.Schema({
    productCode: { type: String, required: true, unique: true, trim: true, minlength: 8, match: /^[A-Z]{3}-\d{4}$/ },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 100 },
    category: { type: String, required: true, enum: ProductCategories },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true },
    inventory: [
        {
            size: { type: String, enum: SizeTypes },            
            stock: { type: Number, required: true, min: 0 }
        }
    ]
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);