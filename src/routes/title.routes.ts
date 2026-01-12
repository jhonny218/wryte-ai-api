import { Router } from "express";
import { titleController } from "../controllers/title.controller";

const router = Router();

// Get titles for an organization
router.get('/:orgId', titleController.getTitles);

// Update a title by ID for an organization
router.put('/:orgId/:titleId', titleController.updateTitle);

// delete a title by ID for an organization
router.delete('/:orgId/:titleId', titleController.deleteTitle);



export const titleRoutes = router;
