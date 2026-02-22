import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  getJobInsightsHandler,
  getResumeFeedbackHandler,
} from "../controllers/insights.controller";
import {
  jobInsightsRequestSchema,
  resumeFeedbackRequestSchema,
} from "../schemas/insights.schema";
import { createRateLimit } from "../middleware/rate-limit.middleware";

const router = Router();
const insightsRateLimit = createRateLimit({ windowMs: 5 * 60 * 1000, max: 30 });

router.post(
  "/job",
  insightsRateLimit,
  requireAuth,
  validateBody(jobInsightsRequestSchema),
  getJobInsightsHandler,
);
router.post(
  "/resume",
  insightsRateLimit,
  requireAuth,
  validateBody(resumeFeedbackRequestSchema),
  getResumeFeedbackHandler,
);

export default router;
