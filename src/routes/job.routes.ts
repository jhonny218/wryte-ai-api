import { Router } from "express";
import { jobController } from "../controllers/job.controller";
import { rateLimitMiddleware } from "../middleware/rate-limit.middleware";

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth) // Apply authentication middleware to all user routes

// Apply rate limiting to job creation
router.post('/title', rateLimitMiddleware, jobController.createTitleGenerationJob);

export const jobRoutes = router;
