import { productRepository } from '../repositories/product.repository.js';
import { ConflictError, NotFoundError } from '../utils/error.helper.js';

export const productService = {
    listActive() {
        return productRepository.findAll();
    },

    listForAdmin() {
        return productRepository.findAll({ includeInactive: true });
    },

    async findById(id, includeInactive = false) {
        const product = await productRepository.findById(id, { includeInactive });
        if (!product) throw new NotFoundError(`Product not found with id: ${id}`);
        return product;
    },

    async create(product) {
        try {
            const id = await productRepository.create(product);
            return await this.findById(id, true);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new ConflictError('Product already exists');
            throw error;
        }
    },

    async update(id, product) {
        await this.findById(id, true);
        try {
            await productRepository.update(id, product);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new ConflictError('Product update conflict');
            throw error;
        }
        return this.findById(id, true);
    },

    async deactivate(id) {
        await this.findById(id, true);
        await productRepository.deactivate(id);
    },

    async delete(id) {
        await this.findById(id, true);
        await productRepository.delete(id);
    },
};
