import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.emun";
import ProjectModel from "../models/project.model";
import { embeddings } from "../utils/embeddings";
import { qdrantClient } from "../config/qdrant";

//**************************
// CREATE NEW WORKSPACE
//************************

export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await UserModel.findById(userId);

  if (!user) throw new NotFoundException("User not found");

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });

  if (!ownerRole) throw new NotFoundException("Owner role not found");

  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });

  await member.save();

  user.currentWorkSpace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  // Generate embedding
  const textToEmbed = `${name} ${description || ""}`;
  const vector = await embeddings.embedQuery(textToEmbed);

  //Store in Qdrant  // Use workspace._id as Qdrant point ID
  await qdrantClient.upsert("workspace_embeddings", {
    points: [
      {
        id: `${workspace?._id}`,
        vector,
        payload: {
          type: "WORKSPACE",
          ownerId: userId,
          name,
          description,
        },
      },
    ],
  });

  return {
    workspace,
  };
};

//**************************
// GET ALL WORKSPACES IS A MEMBER
//************************

export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await MemberModel.find({ userId })
    .populate("workspaceId")
    .select("-password")
    .exec();

  //extract member details from membership
  const workspaces = memberships.map((membership) => membership.workspaceId);

  return { workspaces };
};

//**************************
// GET WORKSPACES By Id
//************************

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) throw new NotFoundException("Workspace Not found");

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMember = {
    ...workspace.toObject(),
    members,
  };

  return {
    workspace: workspaceWithMember,
  };
};

//**************************
// GET All MEMBERS IN WORKSPACE
//************************

export const getWorkspaceMemberService = async (workspaceId: string) => {
  //fetch all members of the workspace

  const members = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email profilePicture -password")
    .populate("role", "name");

  const roles = await RoleModel.find({}, { name: 1, _id: 1 })
    .select("-permission")
    .lean();

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  return { analytics };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) throw new NotFoundException("Workspace not found");

  const role = await RoleModel.findById(roleId);

  if (!role) throw new NotFoundException("Role not found");

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  member.role = role;
  await member.save();

  return { member };
};

export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) throw new NotFoundException("Workspace not found");

  // Update MongoDB
  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;
  await workspace.save();

  // Regenerate & update embedding in Qdrant if name/description changed
  if (name || description) {
    const textToEmbed = `${workspace.name} ${workspace.description || ""}`;
    const vector = await embeddings.embedQuery(textToEmbed);

    await qdrantClient.upsert("workspace_embeddings", {
      points: [
        {
          id: workspaceId,
          vector,
          payload: {
            ...(name && { name }),
            ...(description && { description }),
          },
        },
      ],
    });
  }

  return { workspace };
};

//**************************
// DELETE WORKSPACE
//************************

export const deleteWorkspaceByIdService = async (
  workspaceId: string,
  userId: string
): Promise<{ currentWorkSpace: mongoose.Types.ObjectId | null }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspace = await WorkspaceModel.findById(workspaceId).session(
      session
    );

    if (!workspace) throw new NotFoundException("Workspace not found");

    if (workspace.owner.toString() !== userId)
      throw new BadRequestException(
        "You are not authorized to delete this workspace"
      );

    const user = await UserModel.findById(userId).session(session);

    if (!user) throw new NotFoundException("User not found");

    // Delete from Qdrant first
    await qdrantClient.delete("workspace_embeddings", {
      filter: {
        must: [{ key: "id", match: { value: workspaceId } }],
      },
    });

    await ProjectModel.deleteMany({ workspace: workspace._id }).session(
      session
    ); //change label to workspaceId

    await TaskModel.deleteMany({ workspace: workspace._id }).session(session); //change label to workspaceId

    await MemberModel.deleteMany({ workspaceId: workspace._id }).session(
      session
    );

    if (user?.currentWorkSpace?.equals(workspaceId)) {
      const memberWorkspace = await MemberModel.findOne({ userId }).session(
        session
      );

      // update the current Workspace
      user.currentWorkSpace = memberWorkspace
        ? memberWorkspace.workspaceId
        : null;

      await user.save({ session });
    }

    await workspace.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return { currentWorkSpace: user.currentWorkSpace || null };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

//**************************
// SEARCH WORKSPACE FOR AI ASSISTANCE
//************************

export const searchWorkspacesService = async (
  query: string,
  userId: string
) => {
  // 1. Get user's workspace IDs (for filtering)
  const userMemberships = await MemberModel.find({ userId });
  const userWorkspaceIds = userMemberships.map((m) => m.workspaceId.toString());

  // 2. Embed the query
  const queryEmbedding = await embeddings.embedQuery(query);

  // 3. Search Qdrant (correct response handling)
  const searchResult = await qdrantClient.search("workspace_embeddings", {
    vector: queryEmbedding,
    filter: {
      must: [
        { key: "id", match: { any: userWorkspaceIds } },
        { key: "type", match: { value: "WORKSPACE" } },
      ],
    },
    limit: 5,
  });

  // 4. Extract workspace IDs from Qdrant results
  const workspaceIds = searchResult.map((result) => result.id);

  // 5. Fetch full workspace details from MongoDB
  const workspaces = await WorkspaceModel.find({
    _id: { $in: workspaceIds },
  });

  return { workspaces };
};
