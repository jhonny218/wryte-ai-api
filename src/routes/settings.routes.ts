import { Router } from 'express'
import { settingsController } from 'src/controllers/settings.controller';
import { requireAuth } from 'src/middleware/auth.middleware';
import { validate } from 'src/middleware/validation.middleware';
import { upsertContentSettingsSchema } from 'src/validators/settings.validator';

const router = Router();

router.use(requireAuth) // Apply authentication middleware to all user routes

// Get settings for an organization
router.get('/:orgId', settingsController.getByOrgId)

// Upsert settings for an organization
router.put('/:orgId', validate(upsertContentSettingsSchema), settingsController.upsert)

export { router as settingsRoutes };