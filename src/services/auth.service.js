import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../utils/error.helper.js';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET must be configured');
    return secret;
};

const createToken = (user) => jwt.sign(
    { sub: String(user.id) },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);

const toAuthResponse = (user) => ({
    user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    },
    token: createToken(user),
});

export const authService = {
    async register({ username, email, password }) {
        if (await authRepository.findByEmail(email)) {
            throw new ConflictError('Email is already registered');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        let userId;
        try {
            userId = await authRepository.createUser({
                username,
                email,
                password_hash: passwordHash,
                role: 'user',
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictError('Email or username is already in use');
            }
            throw error;
        }

        const user = await userRepository.findById(userId);
        if (!user) throw new Error('Registered user could not be loaded');
        return toAuthResponse(user);
    },

    async login({ email, password }) {
        const user = await authRepository.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new UnauthorizedError('Email or password is incorrect');
        }
        return toAuthResponse(user);
    },
};
