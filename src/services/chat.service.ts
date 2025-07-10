import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import { NotFoundException } from "../utils/appError";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import ChatModel from "../models/chat.model";


//Create chat service
export const createChatService = async (
  userId: string,
  workspaceId?: string,
  projectId?: string,
  title?: string
) => {
  const chat = new ChatModel({
    user: userId,
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

//Get user chats service
export const getUserChatsSerive = async (userId: string) => {

  if(!userId) throw new NotFoundException("userId not found!");

  const chats = await ChatModel.find({ user: userId })
    .sort({ updatedAt: -1 })
    .populate("workspace", "name")
    .populate("project", "title");

    return { chats};
};

//Get chat by Id
export const getChatByIdService = async (chatId: string, userId: string) => {

  if(!chatId) throw new NotFoundException("chatId not found");

  const chat = await ChatModel.findOne({
    _id: chatId,
    user: userId
  })
    .populate("project", "title");

  if (!chat) {
    throw new NotFoundException("Chat not found");
  }

  console.log("chat", chat);

  return { chat };
};

//Add message to Chat
export const addMessageToChatService = async (
  chatId: string,
  userId: string,
  role: string,
  content: string,
  sources?: { title: string; url: string; score?: number }[] // Optional sources for AI responses
) => {

  if (!chatId) throw new NotFoundException("chatId not found");

  const chat = await ChatModel.findOneAndUpdate(
    { _id: chatId, user: userId }, // Ensure chat belongs to user
    { 
      $push: { 
        messages: { 
          role, 
          content, 
          ...(sources && { sources }) // Conditionally add sources
        } 
      }
    },
    { new: true }
  ).populate("project", "title");

  if (!chat) throw new NotFoundException("Chat not found");
  return { chat };
};