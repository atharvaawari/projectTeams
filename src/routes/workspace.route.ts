import { Router } from "express";
import { createWorkspaceController, getAllWorkspacesUserIsMemberController, getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMembersController } from "../controllers/workspace.controller";


const workspaceRoute = Router(); 

workspaceRoute.post('/create/new', createWorkspaceController);
workspaceRoute.get('/all', getAllWorkspacesUserIsMemberController);

workspaceRoute.get('/members/:id', getWorkspaceMembersController);
workspaceRoute.get('/analytics/:id', getWorkspaceAnalyticsController);

workspaceRoute.get('/:id', getWorkspaceByIdController);




export default workspaceRoute;