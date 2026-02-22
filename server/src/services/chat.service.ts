import prisma from "../config/prisma";
import { generateChatReply } from "./ai.service";

export const createChat = async (
  userId: string,
  jobTitle: string,
  jobDescription: string,
) => {
  return prisma.chat.create({
    data: {
      userId,
      jobTitle,
      jobDescription,
    },
  });
};

export const listChats = async (userId: string) => {
  return prisma.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      jobTitle: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getChatById = async (userId: string, chatId: string) => {
  return prisma.chat.findFirst({
    where: {
      id: chatId,
      userId, // ownership enforced here
    },
    select: {
      id: true,
      jobTitle: true,
      jobDescription: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

export const sendMessage = async (
  userId: string,
  chatId: string,
  content: string,
) => {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    return null;
  }

  const historyForModel = [
    ...chat.messages.map((message) => ({
      role: message.role as "system" | "user" | "assistant",
      content: message.content,
    })),
    { role: "user" as const, content },
  ];

  const assistantReply = await generateChatReply({
    jobTitle: chat.jobTitle,
    jobDescription: chat.jobDescription,
    messages: historyForModel,
  });

  await prisma.$transaction([
    prisma.message.create({
      data: {
        chatId,
        role: "user",
        content,
      },
    }),
    prisma.message.create({
      data: {
        chatId,
        role: "assistant",
        content: assistantReply,
      },
    }),
  ]);

  return getChatById(userId, chatId);
};
