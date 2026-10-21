import { productService } from '../services/product.service.js';
import { HttpResponse } from '../utils/success.helper.js';

export const productController = {
    async list(req, res) {
        const products = await productService.listActive();
        return new HttpResponse(res).success(products);
    },

    async listForAdmin(req, res) {
        const products = await productService.listForAdmin();
        return new HttpResponse(res).success(products);
    },

    async getById(req, res) {
        const product = await productService.findById(req.params.id, req.user?.role === 'admin');
        return new HttpResponse(res).success(product);
    },

    async create(req, res) {
        const product = await productService.create(req.body);
        return new HttpResponse(res).created(product, 'Product created successfully');
    },

    async update(req, res) {
        const product = await productService.update(req.params.id, req.body);
        return new HttpResponse(res).success(product, 'Product updated successfully');
    },

    async deactivate(req, res) {
        await productService.deactivate(req.params.id);
        return new HttpResponse(res).success(null, 'Product deactivated successfully');
    },
};
