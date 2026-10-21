export class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends ErrorResponse {
    constructor(message = "Bad Request",errors = []) {
        super(message,400);
        this.errors = errors;
    }
}

export class UnauthorizedError extends ErrorResponse {
    constructor(message = "Unauthorized"){
        super(message,401);
    }
}

export class ForbiddenError extends ErrorResponse {
    constructor(message = "Forbidden") {
        super(message,403);
    }
}

export class NotFoundError extends ErrorResponse {
    constructor(message = "Not Found") {
        super(message,404);
    }
}

export class ConflictError extends ErrorResponse {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

export class InternalServerError extends ErrorResponse {
    constructor(message = "Internal Server Error") {
        super(message,500);
    }
}