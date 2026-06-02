export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (statusCode >= 500) {
        console.error("ERROR: ", err);
    } else {
        console.warn(`[${statusCode}] ${err.message}`);
    }

    res.status(statusCode).json({
        status: err.status || "error",
        message: err.message || "Error interno del servidor"
    });
};
