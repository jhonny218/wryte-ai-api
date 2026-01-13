import { Router } from "express";
import { outlineController } from "../controllers/outline.controller";

const router = Router();

// Get outlines for an organization
router.get('/:orgId', outlineController.getOutlines);

// Update an outline by ID for an organization
router.put('/:orgId/:outlineId', outlineController.updateOutline);

// Delete an outline by ID for an organization
router.delete('/:orgId/:outlineId', outlineController.deleteOutline);


export const outlineRoutes = router;