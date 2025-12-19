import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { organizationRoutes } from "./organization.routes";
import { settingsRoutes } from "./settings.routes";
import { webhookRoutes } from "./webhook.routes";
import { jobRoutes } from "./job.routes";
import { titleRoutes } from "./title.routes";

const routes = Router();

// Webhooks must come first (before auth middleware)
routes.use('/webhooks', webhookRoutes);

// Protected routes
routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/organizations', organizationRoutes);
routes.use('/settings', settingsRoutes);
routes.use('/jobs', jobRoutes);
routes.use('/titles', titleRoutes);

export { routes }