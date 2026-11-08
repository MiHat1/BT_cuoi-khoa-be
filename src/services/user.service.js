import { userRepository } from '../repositories/user.repository.js';
import { ConflictError, NotFoundError } from '../utils/error.helper.js';

export const userService = {
    async getAllUsers() {
        return userRepository.findAll();
    },

    async findById(id) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError(`nguoi dung k tim thay voi id : ${id}`);
        return user;
    },

    async updateProfile(id, profile) {
        if (profile.email) {
            const existingUser = await userRepository.findByEmail(profile.email);
            if (existingUser && Number(existingUser.id) !== Number(id)) {
                throw new ConflictError('email da ton tai');
            }
        }

        try {
            await userRepository.updateProfile(id, profile);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictError('email da ton tai');
            }
            throw error;
        }

        return this.findById(id);
    },
};
