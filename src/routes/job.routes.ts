import { Router } from "express";
import { jobController } from "../controllers/job.controller";
import { rateLimitMiddleware } from "../middleware/rate-limit.middleware";

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth) // Apply authentication middleware to all user routes

// Get job status by ID
router.get('/:jobId', jobController.getJobStatus);

// Create a new title generation job
router.post('/title', rateLimitMiddleware, jobController.createTitleGenerationJob);

// Create a new outline generation job
router.post('/outline', rateLimitMiddleware, jobController.createOutlineGenerationJob);

// Create a new blog generation job
router.post('/blog', rateLimitMiddleware, jobController.createBlogGenerationJob);

export const jobRoutes = router;
