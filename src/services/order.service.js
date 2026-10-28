import { orderRepository } from '../repositories/order.repository.js';
import { BadRequestError, NotFoundError } from '../utils/error.helper.js';

const orderError = (error) => {
    if (error.message === 'ORDER_PRODUCT_UNAVAILABLE') {
        return new BadRequestError('One or more selected products are unavailable or inactive');
    }
    if (error.message.startsWith('ORDER_INSUFFICIENT_STOCK:')) {
        const productName = error.message.replace('ORDER_INSUFFICIENT_STOCK:', '');
        return new BadRequestError(`Insufficient stock for product: ${productName}`);
    }
    if (error.message === 'ORDER_TOTAL_TOO_LARGE') {
        return new BadRequestError('Order total amount exceeds allowable limit');
    }
    if (error.message === 'ORDER_ALREADY_FINISHED') {
        return new BadRequestError('Cannot update status of a finished order (DELIVERED or CANCELLED)');
    }
    if (error.message === 'ORDER_INVALID_STATUS_TRANSITION') {
        return new BadRequestError('Invalid order status transition. Allowed: PENDING -> SHIPPING -> DELIVERED or PENDING -> CANCELLED');
    }
    return error;
};

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

    async findById(id, { userId } = {}) {
        const order = await orderRepository.findById(id, { userId });
        if (!order) throw new NotFoundError(`Order not found with id: ${id}`);
        return order;
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
