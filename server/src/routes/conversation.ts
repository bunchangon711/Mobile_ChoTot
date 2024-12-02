import { Router } from "express";
import {
  getConversations,
  getLastChats,
  getOrCreateConversation,
  updateChatSeenStatus,
  // sendChatMessage,
  deleteMessage
} from "src/controllers/conversation";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";
import { Server } from 'socket.io';

const conversationRouter = Router();

conversationRouter.get("/with/:peerId", isAuth, getOrCreateConversation);
conversationRouter.get("/chats/:conversationId", isAuth, getConversations);
conversationRouter.get("/last-chats", isAuth, getLastChats);
conversationRouter.patch(
  "/seen/:conversationId/:peerId",
  isAuth,
  updateChatSeenStatus
);
// conversationRouter.post(
//   "/message/:conversationId",
//   isAuth,
//   fileParser,
//   sendChatMessage
// );
conversationRouter.delete("/message/:conversationId/:messageId", isAuth, deleteMessage);

export default conversationRouter;


export const attachIO = (io: Server) => {
  conversationRouter.use((req, _res, next) => {
    req.app.set('io', io);
    next();
  });
};
