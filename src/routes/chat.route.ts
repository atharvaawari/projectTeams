import { Router } from "express";
import { createChatController, getUserChatsController } from "../controllers/chats.controller";

const chatRouter = Router();

chatRouter.post('/create', createChatController);

chatRouter.get('/get', getUserChatsController);

export default chatRouter;