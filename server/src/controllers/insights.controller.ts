import { Request, Response } from "express";
import { generateJobInsights, generateResumeFeedback } from "../services/ai.service";

export const getJobInsightsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { jobTitle, jobDescription } = req.body;
    const insights = await generateJobInsights({ jobTitle, jobDescription });

    return res.json(insights);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to generate job insights" });
  }
};

export const getResumeFeedbackHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { jobTitle, jobDescription, resumeText } = req.body;
    const feedback = await generateResumeFeedback({
      jobTitle,
      jobDescription,
      resumeText,
    });

    return res.json(feedback);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to generate resume feedback" });
  }
};
