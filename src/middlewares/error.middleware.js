import { ErrorResponse } from '../utils/error.helper.js';

export const errorHandler = (err, req, res, next) => {
    const isKnownError = err instanceof ErrorResponse;
    const isInvalidJson = err.type === 'entity.parse.failed';
    const isPayloadTooLarge = err.type === 'entity.too.large';
    const statusCode = isKnownError
        ? err.statusCode
        : isInvalidJson
            ? 400
            : isPayloadTooLarge
                ? 413
                : 500;
    const response = {
        success: false,
        message: isKnownError
            ? err.message
            : isInvalidJson
                ? 'Malformed JSON request body'
                : isPayloadTooLarge
                    ? 'Request body is too large'
                    : 'Internal server error',
    };

    if (statusCode >= 500) console.error(err);

    if (isKnownError && Array.isArray(err.errors) && err.errors.length > 0) {
        response.errors = err.errors;
    }

    return res.status(statusCode).json(response);
};
