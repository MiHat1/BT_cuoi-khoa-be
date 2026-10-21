import { BadRequestError } from '../utils/error.helper.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        return next(new BadRequestError('Invalid input data', errors));
    }

    req[source] = result.data;
    return next();
};
