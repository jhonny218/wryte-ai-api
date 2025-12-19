import { Router } from "express";
import { titleController } from "../controllers/title.controller";

const router = Router();

router.get('/:orgId', titleController.getTitles);

export const titleRoutes = router;
