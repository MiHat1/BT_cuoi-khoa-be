import { userRepository } from '../repositories/user.repository.js';
import { ConflictError, NotFoundError } from '../utils/error.helper.js';

export const userService = {
    async getAllUsers() {
        return userRepository.findAll();
    },

    async findById(id) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError(`User not found with id: ${id}`);
        return user;
    },

    async updateProfile(id, profile) {
        if (profile.email) {
            const existingUser = await userRepository.findByEmail(profile.email);
            if (existingUser && Number(existingUser.id) !== Number(id)) {
                throw new ConflictError('Email is already in use');
            }
        }

        try {
            await userRepository.updateProfile(id, profile);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictError('Email or username is already in use');
            }
            throw error;
        }

        return this.findById(id);
    },
};
