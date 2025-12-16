import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

export async function startServer() {
  const PORT = env.PORT || 3000;

  return new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Running on http://localhost:${PORT}/`)
      resolve();
    })
  });
}
