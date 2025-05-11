import { Router } from "express";
import { createProjectController, deleteProjectController, getAllProjectsInWorkspaceController, getprojectAnalyticsController, getProjectByIdAndWorkspaceIdController, updateProjectController } from "../controllers/project.controller";


const projectRoute = Router();


projectRoute.post("/workspace/:workspaceId/create", createProjectController);

projectRoute.put("/:id/workspace/:workspaceId/update", updateProjectController);

projectRoute.delete("/:id/workspace/:workspaceId/delete", deleteProjectController);

projectRoute.get("/workspace/:workspaceId/all", getAllProjectsInWorkspaceController);

projectRoute.get("/:id/workspace/:workspaceId/analytics", getprojectAnalyticsController);

projectRoute.get("/:id/workspace/:workspaceId", getProjectByIdAndWorkspaceIdController);

export default projectRoute;