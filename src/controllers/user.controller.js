import { userService } from '../services/user.service.js';
import { HttpResponse } from '../utils/success.helper.js';

export const userController = {
    async getMe(req, res) {
        const user = await userService.findById(req.user.id);
        return new HttpResponse(res).success(user);
    },

    async updateMe(req, res) {
        const user = await userService.updateProfile(req.user.id, req.body);
        return new HttpResponse(res).success(user, 'Profile updated successfully');
    },
};
