import { Router } from "express";
import {
  createChatHandler,
  listChatsHandler,
  getChatByIdHandler,
  sendMessageHandler,
} from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createChatSchema, sendMessageSchema } from "../schemas/chat.schema";

const router = Router();

router.post("/", requireAuth, validateBody(createChatSchema), createChatHandler);
router.get("/", requireAuth, listChatsHandler);
router.get("/:id", requireAuth, getChatByIdHandler);
router.post(
  "/:id/messages",
  requireAuth,
  validateBody(sendMessageSchema),
  sendMessageHandler,
);

export default router;
