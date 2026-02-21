import { Request, Response } from "express";
import {
  createChat,
  listChats,
  getChatById,
  sendMessage,
} from "../services/chat.service";

export const createChatHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobTitle, jobDescription } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({
        error: "jobTitle and jobDescription are required",
      });
    }

    const chat = await createChat(userId, jobTitle, jobDescription);

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to create chat" });
  }
};

export const listChatsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chats = await listChats(userId);
    res.json(chats);
  } catch {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

export const getChatByIdHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.id;

    if (typeof chatId !== "string") {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chat = await getChatById(userId, chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
};

export const sendMessageHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const chatId = req.params.id;
    const { content } = req.body;

    if (typeof chatId !== "string") {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedChat = await sendMessage(userId, chatId, content);

    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json(updatedChat);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to send message" });
  }
};
