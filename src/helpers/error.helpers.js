export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'error' : 'fail';

        Error.captureStackTrace(this, this.constructor);
    }
}