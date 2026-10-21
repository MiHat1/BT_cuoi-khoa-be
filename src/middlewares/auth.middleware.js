import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { ForbiddenError, UnauthorizedError } from '../utils/error.helper.js';

export const authenticate = async (req, res, next) => {
    const authorization = req.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Bearer token is required');
    }

    let payload;
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET must be configured');
        payload = jwt.verify(authorization.slice(7), secret);
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Invalid or expired token');
        }
        throw error;
    }

    if (typeof payload === 'string' || !payload.sub) {
        throw new UnauthorizedError('Invalid token payload');
    }

    const user = await userRepository.findAuthUserById(payload.sub);
    if (!user) throw new UnauthorizedError('Account no longer exists');

    req.user = user;
    return next();
};

export const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        throw new ForbiddenError('You do not have permission to perform this action');
    }
    return next();
};
