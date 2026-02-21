import axios from "axios";
import { getToken } from "./auth";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type ChatSummary = {
  id: string;
  jobTitle: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatDetail = {
  id: string;
  userId: string;
  jobTitle: string;
  jobDescription: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type JobInsights = {
  roleSummary: string;
  requiredSkills: string[];
  interviewTopics: string[];
  codingFocusAreas: string[];
  suggestedPracticeQuestions: string[];
  days30_60_90: {
    first30Days: string[];
    days31To60: string[];
    days61To90: string[];
  };
};

export type ResumeFeedback = {
  overallAssessment: string;
  strengths: string[];
  gaps: string[];
  rewriteSuggestions: string[];
  atsTips: string[];
};

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5000/api";

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const register = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  await client.post("/auth/register", payload);
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await client.post<{ token: string }>("/auth/login", payload);
  return data.token;
};

export const me = async () => {
  const { data } = await client.get<User>("/auth/me");
  return data;
};

export const listChats = async () => {
  const { data } = await client.get<ChatSummary[]>("/chats");
  return data;
};

export const createChat = async (payload: {
  jobTitle: string;
  jobDescription: string;
}) => {
  const { data } = await client.post<ChatDetail>("/chats", payload);
  return data;
};

export const getChatById = async (chatId: string) => {
  const { data } = await client.get<ChatDetail>(`/chats/${chatId}`);
  return data;
};

export const sendMessage = async (chatId: string, content: string) => {
  const { data } = await client.post<ChatDetail>(`/chats/${chatId}/messages`, {
    content,
  });
  return data;
};

export const getJobInsights = async (payload: {
  jobTitle: string;
  jobDescription: string;
}) => {
  const { data } = await client.post<JobInsights>("/insights/job", payload);
  return data;
};

export const getResumeFeedback = async (payload: {
  jobTitle: string;
  jobDescription: string;
  resumeText: string;
}) => {
  const { data } = await client.post<ResumeFeedback>("/insights/resume", payload);
  return data;
};
