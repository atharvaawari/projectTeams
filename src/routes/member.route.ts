import { Router } from "express";
import { joinWorkspaceController } from "../controllers/member.controller";

const memberRoute = Router();

memberRoute.post("/workspace/:inviteCode/join", joinWorkspaceController);

export default memberRoute;