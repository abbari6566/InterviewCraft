import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { createRateLimit } from "../middleware/rate-limit.middleware";

const router = Router();
const authRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
