import { Router } from "express";
import {
  getConversations,
  getLastChats,
  getOrCreateConversation,
  updateChatSeenStatus,
  sendChatMessage
} from "src/controllers/conversation";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";

const conversationRouter = Router();

conversationRouter.get("/with/:peerId", isAuth, getOrCreateConversation);
conversationRouter.get("/chats/:conversationId", isAuth, getConversations);
conversationRouter.get("/last-chats", isAuth, getLastChats);
conversationRouter.patch(
  "/seen/:conversationId/:peerId",
  isAuth,
  updateChatSeenStatus
);
conversationRouter.post(
  "/message/:conversationId",
  isAuth,
  fileParser,
  sendChatMessage
);

export default conversationRouter;
