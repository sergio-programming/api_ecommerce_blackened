import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    Product: {
        findById: vi.fn()
    },
    User: {
        findById: vi.fn()
    }
}));

vi.mock("../../src/models/product.model.js", () => ({
    Product: mocks.Product,
    SizeTypes: ["S", "M", "L", "XL"]
}));

vi.mock("../../src/models/user.model.js", () => ({
    User: mocks.User
}));

vi.mock("../../src/models/order.model.js", () => ({
    Order: {},
    OrderStatus: ["Pendiente", "Enviada", "Entregada", "Cancelada"],
    PaymentStatus: ["Pendiente", "Pagada", "Rechazado"]
}));

const execResolved = (value) => ({
    lean: () => ({
        exec: vi.fn().mockResolvedValue(value)
    })
});

const validUserId = "6650f1d85f8a7f39d7b4a001";
const shirtProductId = "6650f1d85f8a7f39d7b4a002";
const cdProductId = "6650f1d85f8a7f39d7b4a003";

const activeUser = {
    _id: validUserId,
    isActive: true
};

const shirtProduct = {
    _id: {
        toString: () => shirtProductId
    },
    category: "Camisetas",
    price: 55000,
    inventory: [
        { size: "S", stock: 4 },
        { size: "M", stock: 2 }
    ]
};

const cdProduct = {
    _id: {
        toString: () => cdProductId
    },
    category: "CD",
    price: 45000,
    inventory: [
        { stock: 5 }
    ]
};

const validOrderBody = {
    user: validUserId,
    items: [
        { product: shirtProductId, size: "M", quantity: 2 }
    ],
    shippingAddress: " Calle 80 # 104 - 72 ",
    city: " Bogota ",
    phoneNumber: " 3001234567 ",
    shippingMethod: " Express ",
    paymentMethod: " Contraentrega "
};

describe("order services validations", () => {
    let service;

    beforeEach(async() => {
        vi.clearAllMocks();
        service = await import("../../src/services/order.services.js");
    });

    it("crea datos normalizados de una orden valida y calcula total con transporte", async() => {
        mocks.User.findById.mockReturnValue(execResolved(activeUser));
        mocks.Product.findById.mockReturnValue(execResolved(shirtProduct));

        const result = await service.validateCreateOrderInput(validOrderBody);

        expect(result).toEqual({
            user: validUserId,
            items: [
                {
                    product: shirtProduct._id,
                    size: "M",
                    quantity: 2,
                    priceAtMoment: 55000
                }
            ],
            shippingAddress: "Calle 80 # 104 - 72",
            city: "Bogota",
            phoneNumber: "3001234567",
            shippingMethod: "Express",
            paymentMethod: "Contraentrega",
            status: "Pendiente",
            paymentStatus: "Pendiente",
            total: 122000
        });
    });

    it("rechaza crear una orden para un usuario inactivo", async() => {
        mocks.User.findById.mockReturnValue(execResolved({
            ...activeUser,
            isActive: false
        }));

        await expect(service.validateCreateOrderInput(validOrderBody))
            .rejects
            .toMatchObject({
                message: "Usuario inactivo",
                statusCode: 403
            });
    });

    it("rechaza telefono que no tenga 10 digitos", async() => {
        mocks.User.findById.mockReturnValue(execResolved(activeUser));

        await expect(
            service.validateCreateOrderInput({
                ...validOrderBody,
                phoneNumber: "12345"
            })
        ).rejects.toMatchObject({
            message: "El numero telefonico debe tener 10 digitos",
            statusCode: 400
        });
    });

    it("rechaza talla faltante para productos que la requieren", async() => {
        mocks.User.findById.mockReturnValue(execResolved(activeUser));
        mocks.Product.findById.mockReturnValue(execResolved(shirtProduct));

        await expect(
            service.validateCreateOrderInput({
                ...validOrderBody,
                items: [{ product: shirtProductId, quantity: 1 }]
            })
        ).rejects.toMatchObject({
            message: "Debe seleccionar una talla valida",
            statusCode: 400
        });
    });

    it("rechaza talla en un producto que no la requiere", async() => {
        mocks.User.findById.mockReturnValue(execResolved(activeUser));
        mocks.Product.findById.mockReturnValue(execResolved(cdProduct));

        await expect(
            service.validateCreateOrderInput({
                ...validOrderBody,
                items: [{ product: cdProductId, size: "M", quantity: 1 }]
            })
        ).rejects.toMatchObject({
            message: "Este producto no requiere talla",
            statusCode: 400
        });
    });

    it("rechaza stock insuficiente acumulado para el mismo producto y talla", async() => {
        mocks.User.findById.mockReturnValue(execResolved(activeUser));
        mocks.Product.findById.mockReturnValue(execResolved(shirtProduct));

        await expect(
            service.validateCreateOrderInput({
                ...validOrderBody,
                items: [
                    { product: shirtProductId, size: "M", quantity: 1 },
                    { product: shirtProductId, size: "M", quantity: 2 }
                ]
            })
        ).rejects.toMatchObject({
            message: "Stock insuficiente para uno de los productos",
            statusCode: 400
        });
    });

    it("rechaza actualizar items de una orden existente", async() => {
        await expect(
            service.validateUpdateOrderInput({
                items: [{ product: shirtProductId, size: "M", quantity: 1 }]
            })
        ).rejects.toMatchObject({
            message: "No se permite actualizar items de una orden existente",
            statusCode: 400
        });
    });

    it("acepta actualizar status y paymentStatus validos", async() => {
        const result = await service.validateUpdateOrderInput({
            status: "Enviada",
            paymentStatus: "Pagada"
        });

        expect(result).toEqual({
            status: "Enviada",
            paymentStatus: "Pagada"
        });
    });
});
