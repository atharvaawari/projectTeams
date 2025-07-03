import { Router } from "express";
import { getAiResponseController } from "../controllers/ai.controller";

const aiRouter = Router();

aiRouter.post('/query', getAiResponseController);

export default aiRouter;