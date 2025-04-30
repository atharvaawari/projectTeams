import { Router } from "express";
import {changeWorkspaceMemberRoleController, createWorkspaceController, getAllWorkspacesUserIsMemberController, getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMembersController } from "../controllers/workspace.controller";


const workspaceRoute = Router(); 

workspaceRoute.post('/create/new', createWorkspaceController);
workspaceRoute.put('/change/member/role/:id', changeWorkspaceMemberRoleController); //workspaceId
workspaceRoute.get('/all', getAllWorkspacesUserIsMemberController);
workspaceRoute.get('/members/:id', getWorkspaceMembersController);
workspaceRoute.get('/analytics/:id', getWorkspaceAnalyticsController);

workspaceRoute.get('/:id', getWorkspaceByIdController);




export default workspaceRoute;