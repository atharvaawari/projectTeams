import { Router } from "express";
import {changeWorkspaceMemberRoleController, createWorkspaceController, deleteWorkspaceByIdcontroller, getAllWorkspacesUserIsMemberController, getWorkspaceAnalyticsController, getWorkspaceByIdController, getWorkspaceMembersController, updateWorkspaceByIdController } from "../controllers/workspace.controller";


const workspaceRoute = Router(); 

workspaceRoute.post('/create/new', createWorkspaceController);
workspaceRoute.put('/update/:id', updateWorkspaceByIdController);
workspaceRoute.put('/change/member/role/:id', changeWorkspaceMemberRoleController); //workspaceId
workspaceRoute.delete('/delete/:id', deleteWorkspaceByIdcontroller); //workspaceId
workspaceRoute.get('/all', getAllWorkspacesUserIsMemberController);
workspaceRoute.get('/members/:id', getWorkspaceMembersController);
workspaceRoute.get('/analytics/:id', getWorkspaceAnalyticsController);

workspaceRoute.get('/:id', getWorkspaceByIdController);




export default workspaceRoute;