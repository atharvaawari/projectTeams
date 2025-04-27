import { Router } from "express";
import { createWorkspaceController } from "../controllers/workspace.controller";


const workspaceRoute = Router(); 

workspaceRoute.post('/create/new', createWorkspaceController);



export default workspaceRoute;