import { z } from "zod";

export const createChatSchema = z.object({
  jobTitle: z.string().trim().min(2).max(150),
  jobDescription: z.string().trim().min(20).max(12000),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
