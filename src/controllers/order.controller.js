import { orderService } from '../services/order.service.js';
import { HttpResponse } from '../utils/success.helper.js';

export const orderController = {
    async create(req, res) {
        const order = await orderService.create(req.user.id, req.body.items);
        return new HttpResponse(res).created(order, 'Order created successfully');
    },

    async listMine(req, res) {
        const orders = await orderService.listForUser(req.user.id);
        return new HttpResponse(res).success(orders);
    },

    async listAll(req, res) {
        const orders = await orderService.listAll();
        return new HttpResponse(res).success(orders);
    },

    async updateStatus(req, res) {
        const order = await orderService.updateStatus(req.params.id, req.body.status);
        return new HttpResponse(res).success(order, 'Order status updated successfully');
    },
};
