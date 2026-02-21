import { z } from "zod";

export const jobInsightsRequestSchema = z.object({
  jobTitle: z.string().trim().min(2).max(150),
  jobDescription: z.string().trim().min(30).max(12000),
});

export const jobInsightsResponseSchema = z.object({
  roleSummary: z.string(),
  requiredSkills: z.array(z.string()).min(3).max(12),
  interviewTopics: z.array(z.string()).min(3).max(12),
  codingFocusAreas: z.array(z.string()).min(3).max(12),
  suggestedPracticeQuestions: z.array(z.string()).min(3).max(10),
  days30_60_90: z.object({
    first30Days: z.array(z.string()).min(2).max(8),
    days31To60: z.array(z.string()).min(2).max(8),
    days61To90: z.array(z.string()).min(2).max(8),
  }),
});

export const resumeFeedbackRequestSchema = z.object({
  jobTitle: z.string().trim().min(2).max(150),
  jobDescription: z.string().trim().min(30).max(12000),
  resumeText: z.string().trim().min(100).max(30000),
});

export const resumeFeedbackResponseSchema = z.object({
  overallAssessment: z.string(),
  strengths: z.array(z.string()).min(2).max(10),
  gaps: z.array(z.string()).min(2).max(10),
  rewriteSuggestions: z.array(z.string()).min(2).max(12),
  atsTips: z.array(z.string()).min(2).max(8),
});

export type JobInsightsRequest = z.infer<typeof jobInsightsRequestSchema>;
export type JobInsightsResponse = z.infer<typeof jobInsightsResponseSchema>;
export type ResumeFeedbackRequest = z.infer<typeof resumeFeedbackRequestSchema>;
export type ResumeFeedbackResponse = z.infer<typeof resumeFeedbackResponseSchema>;
