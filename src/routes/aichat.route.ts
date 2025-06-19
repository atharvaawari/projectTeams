import { Router } from "express";
import { handleUserQuerry, handleWorkspaceQuery } from "../controllers/llm.controller";

const chatRouter = Router();

chatRouter.post('/query', handleUserQuerry);
chatRouter.post('/workspace-query', handleWorkspaceQuery);

export default chatRouter;