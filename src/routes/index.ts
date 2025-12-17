import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { organizationRoutes } from "./organization.routes";
import { settingsRoutes } from "./settings.routes";
import { webhookRoutes } from "./webhook.routes";

const routes = Router();

// Webhooks must come first (before auth middleware)
routes.use('/webhooks', webhookRoutes);

// Protected routes
routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/organizations', organizationRoutes);
routes.use('/settings', settingsRoutes);

export { routes }