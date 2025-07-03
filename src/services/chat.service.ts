import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import { NotFoundException } from "../utils/appError";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import ChatModel from "../models/chat.model";

export const createChatService = async (
  userId: string,
  workspaceId?: string,
  projectId?: string,
  title?: string
) => {
  const chat = new ChatModel({
    userId: userId,
    workspace: workspaceId || undefined,
    project: projectId || undefined,
    title: title || "New Chat",
  });

  await chat.save();

  // Add chat reference to user
  await UserModel.findByIdAndUpdate(userId, {
    $push: { chats: chat._id },
  });

  // Optionally add to workspace/project
  if (workspaceId) {
    await WorkspaceModel.findByIdAndUpdate(workspaceId, {
      $push: { aiChats: chat._id },
    });
  }

  if (projectId) {
    await ProjectModel.findByIdAndUpdate(projectId, {
      $push: { aiChats: chat._id },
    });
  }

  return { chat };
};

export const getUserChatsSerive = async (userId: string) => {

  if(!userId) throw new NotFoundException("userId not found!");

  const chats = await ChatModel.find({ user: userId })
    .sort({ updatedAt: -1 })
    .populate("workspace", "name")
    .populate("project", "title");

    return { chats};
};
