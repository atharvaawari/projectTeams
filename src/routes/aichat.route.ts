import { Router } from "express";
import { handleUserQuerry, handleWorkspaceQuery } from "../controllers/llm.controller";
import { getAiResponseController } from "../controllers/ai.controller";

const chatRouter = Router();

// chatRouter.post('/query', handleUserQuerry);
chatRouter.post('/workspace-query', handleWorkspaceQuery);
chatRouter.post('/query', getAiResponseController);

export default chatRouter;