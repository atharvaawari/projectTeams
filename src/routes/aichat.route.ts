import { Router } from "express";
import { handleUserQuerry } from "../controllers/llm.controller";

const chatRouter = Router();

chatRouter.post('/query', handleUserQuerry);

export default chatRouter;