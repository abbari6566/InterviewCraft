import OpenAI from "openai";
import { env } from "../config/env";
import {
  JobInsightsRequest,
  JobInsightsResponse,
  ResumeFeedbackRequest,
  ResumeFeedbackResponse,
  jobInsightsResponseSchema,
  resumeFeedbackResponseSchema,
} from "../schemas/insights.schema";

const MODEL = "gpt-4o-mini";

const getOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in environment variables");
  }

  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
};

const extractJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
};

export const generateJobInsights = async (
  input: JobInsightsRequest,
): Promise<JobInsightsResponse> => {
  const client = getOpenAIClient();

  const systemPrompt =
    "You are an expert interview coach. Return ONLY valid JSON. No markdown, no extra text.";

  const userPrompt = `
Generate structured interview preparation insights.

Job Title:
${input.jobTitle}

Job Description:
${input.jobDescription}

Return a JSON object with this exact shape:
{
  "roleSummary": "string",
  "requiredSkills": ["string"],
  "interviewTopics": ["string"],
  "codingFocusAreas": ["string"],
  "suggestedPracticeQuestions": ["string"],
  "days30_60_90": {
    "first30Days": ["string"],
    "days31To60": ["string"],
    "days61To90": ["string"]
  }
}
`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = extractJson(content);
  const validated = jobInsightsResponseSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("OpenAI response format was invalid");
  }

  return validated.data;
};

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const generateChatReply = async (params: {
  jobTitle: string;
  jobDescription: string;
  messages: ChatMessage[];
}): Promise<string> => {
  const client = getOpenAIClient();

  const systemPrompt = `You are InterviewCraft, an interview coach assistant.
Use the job context to provide concise, practical interview prep help.
When useful, propose follow-up questions, model answers, and improvement steps.`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}

Job Title:
${params.jobTitle}

Job Description:
${params.jobDescription}`,
      },
      ...params.messages,
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty chat response");
  }

  return content;
};

export const generateResumeFeedback = async (
  input: ResumeFeedbackRequest,
): Promise<ResumeFeedbackResponse> => {
  const client = getOpenAIClient();

  const systemPrompt =
    "You are an expert resume reviewer and interview coach. Return ONLY valid JSON.";

  const userPrompt = `
Analyze the resume against the target role and return specific, actionable feedback.

Job Title:
${input.jobTitle}

Job Description:
${input.jobDescription}

Resume Text:
${input.resumeText}

Return JSON with this exact shape:
{
  "overallAssessment": "string",
  "strengths": ["string"],
  "gaps": ["string"],
  "rewriteSuggestions": ["string"],
  "atsTips": ["string"]
}
`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  const parsed = extractJson(content);
  const validated = resumeFeedbackResponseSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("OpenAI resume feedback format was invalid");
  }

  return validated.data;
};
