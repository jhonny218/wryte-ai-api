import { Router } from 'express'
import { userController } from 'src/controllers/user.controller';
import { requireAuth } from 'src/middleware/auth.middleware';
import { validate } from 'src/middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from 'src/validators/user.validator';

const router = Router();

router.use(requireAuth) // Apply authentication middleware to all user routes

// Get current user by Clerk ID
router.get('/me', userController.getByClerkId)

// Get user by ID
router.get('/:id', userController.getById)

// Create user (usually handled by webhook, but available if needed)
router.post('/', validate(createUserSchema), userController.create)

// Update current user
router.put('/me', validate(updateUserSchema), userController.update)

// Delete current user
router.delete('/me', userController.delete)

export { router as userRoutes };