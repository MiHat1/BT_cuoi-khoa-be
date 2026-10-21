import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProductSchema, productIdSchema, updateProductSchema } from '../validations/product.validation.js';

const router = Router();

router.get('/', productController.list);
router.get('/admin/all', authenticate, authorize('admin'), productController.listForAdmin);
router.get('/:id', validate(productIdSchema, 'params'), productController.getById);

router.post('/', authenticate, authorize('admin'), validate(createProductSchema), productController.create);
router.patch('/:id', authenticate, authorize('admin'), validate(productIdSchema, 'params'), validate(updateProductSchema), productController.update);
router.delete('/:id', authenticate, authorize('admin'), validate(productIdSchema, 'params'), productController.deactivate);

export default router;
