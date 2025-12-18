import { Router } from 'express'
import { organizationController } from '../controllers/organization.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOrganizationSchema, updateOrganizationSchema } from '../validators/organization.validator';

const router = Router();

router.use(requireAuth) // Apply authentication middleware to all user routes

// Get all organizations
router.get('/', organizationController.getAll)

// Create a new organization
router.post('/', validate(createOrganizationSchema), organizationController.create)

// Get organization by ID
router.get('/:orgId', organizationController.getById)

// Get organization by slug
router.get('/slug/:slug', organizationController.getBySlug)

// Update organization by ID
router.put('/:orgId', validate(updateOrganizationSchema), organizationController.update)

export { router as organizationRoutes };