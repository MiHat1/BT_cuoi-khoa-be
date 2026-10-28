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
        full_name: user.full_name,
        email: user.email,
        role: user.role,
    },
    token: createToken(user),
});

export const authService = {
    async register({ full_name, email, password }) {
        if (await authRepository.findByEmail(email)) {
            throw new ConflictError('Email is already registered');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        let userId;
        try {
            userId = await authRepository.createUser({
                full_name,
                email,
                password_hash: passwordHash,
                role: 'user',
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictError('Email is already in use');
            }
            throw error;
        }

        const user = await userRepository.findById(userId);
        if (!user) throw new Error('Registered user could not be loaded');
        return toAuthResponse(user);
    },

    async login({ email, full_name, identifier, password }) {
        const loginTarget = email || full_name || identifier;
        const user = await authRepository.findByIdentifier(loginTarget);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
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
            throw new UnauthorizedError('Invalid credentials');
        }

        return toAuthResponse(user);
    },
};
