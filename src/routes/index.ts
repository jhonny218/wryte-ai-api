import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { organizationRoutes } from "./organization.routes";
import { settingsRoutes } from "./settings.routes";
import { webhookRoutes } from "./webhook.routes";

const routes = [
  webhookRoutes,
  authRoutes,
  userRoutes,
  organizationRoutes,
  settingsRoutes
]

export { routes }