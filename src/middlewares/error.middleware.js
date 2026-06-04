export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Error interno del servidor";

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Identificador invalido";
    }

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "campo unico";
        message = `Ya existe un registro con ese ${field}`;
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors || {})[0]?.message || "Datos invalidos";
    }

    if (statusCode >= 500) {
        console.error("ERROR: ", err);
    } else {
        console.warn(`[${statusCode}] ${err.message}`);
    }

    res.status(statusCode).json({
        status: statusCode >= 400 && statusCode < 500 ? "error" : "fail",
        message
    });
};
