import { authService } from '../services/auth.service.js';
import { HttpResponse } from '../utils/success.helper.js';

export const authController = {
    async register(req, res) {
        const data = await authService.register(req.body);
        return new HttpResponse(res).created(data, 'Registration successful');
    },

    async login(req, res) {
        const data = await authService.login(req.body);
        return new HttpResponse(res).success(data, 'Login successful');
    },
};
