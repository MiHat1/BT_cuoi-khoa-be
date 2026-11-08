import { orderRepository } from '../repositories/order.repository.js';
import { BadRequestError, NotFoundError } from '../utils/error.helper.js';

const orderError = (error) => {
    if (error.message === 'ORDER_PRODUCT_UNAVAILABLE') {
        return new BadRequestError('san pham k cs san hoac da bi deactive');
    }
    if (error.message.startsWith('ORDER_INSUFFICIENT_STOCK:')) {
        const productName = error.message.replace('ORDER_INSUFFICIENT_STOCK:', '');
        return new BadRequestError(`vuot qua san pham con lai: ${productName}`);
    }
    if (error.message === 'ORDER_TOTAL_TOO_LARGE') {
        return new BadRequestError('tong gia tri don hang qua lon');
    }
    if (error.message === 'ORDER_ALREADY_FINISHED') {
        return new BadRequestError('don hang da delivered hoac da cancelled');
    }
    if (error.message === 'ORDER_INVALID_STATUS_TRANSITION') {
        return new BadRequestError('trang thai don hang k hop le');
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
        if (!order) throw new NotFoundError('k the tim thay tao don hang voi id nay');
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
        if (!order) throw new NotFoundError(`don hang khong ton tai voi id : ${id}`);
        return order;
    },

    async updateStatus(id, status) {
        try {
            const updated = await orderRepository.updateStatus(id, status);
            if (!updated) throw new NotFoundError(`don hang khong ton tai voi id : ${id}`);
        } catch (error) {
            throw orderError(error);
        }
        return orderRepository.findById(id);
    },
};
