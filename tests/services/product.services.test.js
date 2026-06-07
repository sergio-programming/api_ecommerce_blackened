import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    Product: {
        findOne: vi.fn(),
        findById: vi.fn()
    }
}));

vi.mock("../../src/models/product.model.js", () => ({
    Product: mocks.Product,
    ProductCategories: ["Camisetas", "Buzos", "CD"],
    SizeTypes: ["S", "M", "L", "XL"]
}));

const execResolved = (value) => ({
    lean: () => ({
        exec: vi.fn().mockResolvedValue(value)
    })
});

const validProductId = "6650f1d85f8a7f39d7b4a111";

const validProductBody = {
    productCode: "CAM-0001",
    description: "Camiseta negra estampada",
    category: "Camisetas",
    price: 55000,
    image: "https://cdn.test/camiseta.jpg",
    inventory: [
        { size: "S", stock: 5 },
        { size: "M", stock: 8 }
    ]
};

describe("product services validations", () => {
    let service;

    beforeEach(async() => {
        vi.clearAllMocks();
        service = await import("../../src/services/product.services.js");
    });

    it("normaliza y acepta un producto valido cuando no existe otro con el mismo codigo", async() => {
        mocks.Product.findOne.mockReturnValue(execResolved(null));

        const result = await service.validateCreateProductInput({
            ...validProductBody,
            productCode: " CAM-0001 ",
            description: " Camiseta negra estampada ",
            image: " https://cdn.test/camiseta.jpg "
        });

        expect(result).toEqual(validProductBody);
        expect(mocks.Product.findOne).toHaveBeenCalledWith({ productCode: "CAM-0001" });
    });

    it("rechaza un codigo de producto con formato invalido", async() => {
        await expect(
            service.validateCreateProductInput({
                ...validProductBody,
                productCode: "camiseta-1"
            })
        ).rejects.toMatchObject({
            message: "El codigo debe tener un formato valido",
            statusCode: 400
        });

        expect(mocks.Product.findOne).not.toHaveBeenCalled();
    });

    it("rechaza inventario con tallas duplicadas en camisetas", async() => {
        await expect(
            service.validateCreateProductInput({
                ...validProductBody,
                inventory: [
                    { size: "M", stock: 4 },
                    { size: "M", stock: 2 }
                ]
            })
        ).rejects.toMatchObject({
            message: "No se permite duplicar tallas",
            statusCode: 400
        });
    });

    it("rechaza CD con talla asignada", async() => {
        await expect(
            service.validateCreateProductInput({
                ...validProductBody,
                productCode: "ALB-0001",
                category: "CD",
                inventory: [{ size: "M", stock: 10 }]
            })
        ).rejects.toMatchObject({
            message: "No debes ingresar talla para los CD",
            statusCode: 400
        });
    });

    it("rechaza crear un producto con codigo ya registrado", async() => {
        mocks.Product.findOne.mockReturnValue(execResolved({ _id: validProductId }));

        await expect(service.validateCreateProductInput(validProductBody))
            .rejects
            .toMatchObject({
                message: "Ya existe un producto con este codigo",
                statusCode: 409
            });
    });

    it("valida actualizacion parcial y conserva la categoria actual para validar inventario", async() => {
        mocks.Product.findById.mockReturnValue(execResolved({
            _id: validProductId,
            category: "Camisetas",
            inventory: [{ size: "S", stock: 2 }]
        }));

        const result = await service.validateUpdateProductInput(validProductId, {
            description: " Nueva descripcion valida ",
            inventory: [{ size: "L", stock: 3 }],
            unknownField: "ignored"
        });

        expect(result).toEqual({
            description: "Nueva descripcion valida",
            inventory: [{ size: "L", stock: 3 }]
        });
    });
});
