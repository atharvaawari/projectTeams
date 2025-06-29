import { Router } from "express";
import { getAiResponseController } from "../controllers/ai.controller";

const chatRouter = Router();

chatRouter.post('/query', getAiResponseController);

export default chatRouter;