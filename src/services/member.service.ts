import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import WorkspaceModel from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import { safeUpsertEmbedding } from "../utils/embeddingUtils";


export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member)
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );

  const roleName = member.role?.name;

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();

  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  if (existingMember)
    throw new BadRequestException("You are already a member of this workspace");

  const role = await RoleModel.findOne({ name: Roles.MEMBER });

  if (!role) throw new NotFoundException("Role does not exist");

  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  if (!newMember._id) throw new NotFoundException("member id is missing");

  safeUpsertEmbedding(
    "project_teams_embeddings",
    newMember._id?.toString(),
    role.name,
    {
      type: "MEMBER",
      workspaceId: workspace._id?.toString(),
      role: role.name,
      ownerId: userId,
    }
  );

  return { workspaceId: workspace._id, role: role.name };
};
