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

const router = Router();

router.post("/job", requireAuth, validateBody(jobInsightsRequestSchema), getJobInsightsHandler);
router.post(
  "/resume",
  requireAuth,
  validateBody(resumeFeedbackRequestSchema),
  getResumeFeedbackHandler,
);

export default router;
