import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../utils/error.helper.js';

const getJwtSecret = () => {
    return process.env.JWT_SECRET || 'sgroup_default_secret_key_2026';
};

const createToken = (user) => jwt.sign(
    { sub: String(user.id) },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

const toAuthResponse = (user) => ({
    user: {
        id: user.id,
        username: user.username || user.full_name,
        full_name: user.full_name || user.username,
        email: user.email,
        role: user.role,
    },
    token: createToken(user),
});

export const authService = {
    async register({ username, full_name, email, password }) {
        if (await authRepository.findByEmail(email)) {
            throw new ConflictError('Email is already registered');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        let userId;
        try {
            userId = await authRepository.createUser({
                username: username || full_name,
                full_name: full_name || username,
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
        if (!user) {
            throw new UnauthorizedError('Email or password is incorrect');
        }

        if (user.is_active === 0) {
            throw new UnauthorizedError('Account has been deactivated');
        }

        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password_hash);
        } catch {
            isMatch = false;
        }

        // Support seed records that may have been stored in plain text
        if (!isMatch && password === user.password_hash) {
            isMatch = true;
        }

        if (!isMatch) {
            throw new UnauthorizedError('Email or password is incorrect');
        }

        return toAuthResponse(user);
    },
};
