import { Router } from "express";
import authRoutes from "./auth.routes";
import chatRoutes from "./chat.routes";
import insightsRoutes from "./insights.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/chats", chatRoutes);
router.use("/insights", insightsRoutes);

export default router;
