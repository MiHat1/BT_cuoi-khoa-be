import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validations/user.validation.js';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);

export default router;
