import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrderSchema, orderIdSchema, updateOrderStatusSchema } from '../validations/order.validation.js';

const router = Router();

router.use(authenticate);
router.post('/', validate(createOrderSchema), orderController.create);
router.get('/my-orders', orderController.listMine);
router.get('/', authorize('admin'), orderController.listAll);
router.get('/:id', validate(orderIdSchema, 'params'), orderController.getById);
router.patch('/:id/status', authorize('admin'), validate(orderIdSchema, 'params'), validate(updateOrderStatusSchema), orderController.updateStatus);

export default router;
