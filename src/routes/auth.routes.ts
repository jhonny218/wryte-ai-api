import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get('/auth/login', requireAuth, (req, res) => {
  res.json({ message: 'Login successful' })
})

export { router as authRoutes }
