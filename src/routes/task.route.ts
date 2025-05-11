import { Router } from "express";
import { createTaskController } from "../controllers/task.controller";

const taskRoutes  = Router();

taskRoutes.post("/projects/:projectId/workspace/workspaceId/create", createTaskController);

export default taskRoutes;