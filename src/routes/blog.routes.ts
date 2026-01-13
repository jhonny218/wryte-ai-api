import { Router } from "express";
import { blogController } from "../controllers/blog.controller";

const router = Router();

// Get blogs for an organization
router.get('/:orgId', blogController.getBlogs);

// Update a blog by ID for an organization
router.put('/:orgId/:blogId', blogController.updateBlog);

// Delete a blog by ID for an organization
router.delete('/:orgId/:blogId', blogController.deleteBlog);

export const blogRoutes = router;