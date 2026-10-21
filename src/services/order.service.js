import { orderRepository } from '../repositories/order.repository.js';
import { BadRequestError, NotFoundError } from '../utils/error.helper.js';

export const orderService = {
    async create(userId, items) {
        let orderId;
        try {
            orderId = await orderRepository.create(userId, items);
        } catch (error) {
            throw orderError(error);
        }
        const order = await orderRepository.findById(orderId, { userId });
        if (!order) throw new NotFoundError('Created order could not be loaded');
        return order;
    },

    listForUser(userId) {
        return orderRepository.findAll({ userId });
    },

    listAll() {
        return orderRepository.findAll();
    },

    async updateStatus(id, status) {
        try {
            const updated = await orderRepository.updateStatus(id, status);
            if (!updated) throw new NotFoundError(`Order not found with id: ${id}`);
        } catch (error) {
            throw orderError(error);
        }
        return orderRepository.findById(id);
    },
};
