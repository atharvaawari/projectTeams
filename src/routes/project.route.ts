import { Router } from "express";
import { createProjectController } from "../controllers/project.controller";


const projectRoute = Router();


projectRoute.post("/workspace/:workspaceId/create", createProjectController);

export default projectRoute;