import { Router } from "express";
import { createProjectController, getAllProjectsInWorkspaceController, getProjectByIdAndWorkspaceIdController } from "../controllers/project.controller";


const projectRoute = Router();


projectRoute.post("/workspace/:workspaceId/create", createProjectController);
projectRoute.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);
projectRoute.get("/:id/workspace/:workspaceId", getProjectByIdAndWorkspaceIdController);

export default projectRoute;