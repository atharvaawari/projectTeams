import { Router } from "express";
import { addMessageController, 
  createChatController, 
  getChatByIdController, 
  getUserChatsController } from "../controllers/chats.controller";

const chatRouter = Router();

chatRouter.post('/create', createChatController);
chatRouter.get('/get', getUserChatsController);
chatRouter.get('/chat/:chatId', getChatByIdController);
chatRouter.post("/chat/:chatId/message", addMessageController);

export default chatRouter; 