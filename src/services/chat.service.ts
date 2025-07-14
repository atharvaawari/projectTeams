import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import { NotFoundException } from "../utils/appError";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import ChatModel from "../models/chat.model";
import { MessageDocument, MessageModel } from "../models/message.model";


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
export const getUserChatsService = async (userId: string) => {
  if (!userId) throw new NotFoundException("userId not found!");

  // Find all chats for the user
  const chats = await ChatModel.find({ user: userId }).lean();

  // Get all chat IDs
  const chatIds = chats.map((chat) => chat._id);

  // Find all messages for these chats, sorted by createdAt (oldest first)
  const messages = await MessageModel.find({ chat: { $in: chatIds } })
    .sort({ createdAt: 1 })
    .lean();

  // Group messages by chat ID
  const messagesByChat = messages.reduce((acc, message) => {
    const chatId = message.chat.toString();
    if (!acc[chatId]) {
      acc[chatId] = [];
    }
    acc[chatId].push(message);
    return acc;
  }, {} as Record<string, MessageDocument[]>);

  // Combine chats with their messages
  const chatsWithMessages = chats.map((chat) => ({
    ...chat,
    messages: messagesByChat[chat._id.toString()] || [],
  }));

  return { chats: chatsWithMessages };
};

//Get chat by Id
export const getChatByIdService = async (chatId: string, userId: string) => {
  if (!chatId) throw new NotFoundException("chatId not found");

  const chat = await ChatModel.findOne({
    _id: chatId,
    user: userId,
  })
    .populate("project", "title")
    .lean();

  if (!chat) {
    throw new NotFoundException("Chat not found");
  }

  const messages = await MessageModel.find({ chat: chatId })
    .sort({ createdAt: 1 })
    .lean();

  return {
    chat: {
      ...chat,
      messages,
    },
  };
};

//Add message to Chat
export const addMessageToChatService = async (
  chatId: string,
  userId: string,
  content: string,
  role: "user" | "assistant",
  sources?: {
    title: string;
    url: string;
    score?: number;
  }[]
) => {
  // Verify the chat exists and belongs to the user

  // console.log("chatId", chatId, "user", userId);
  const chat = await ChatModel.findOne({ _id: chatId, user: userId });

  if (!chat) {
    throw new NotFoundException("Chat not found or unauthorized");
  }

  // Create and save the message
  const message = await MessageModel.create({
    chat: chatId,
    content,
    role,
    sources,
  });

  return { message };
};

// export const addMessageToChatService = async (
//   chatId: string,
//     userId: string,
//   content: string,
//   role: string,
//   sources?: [] // Optional sources for AI responses
// ) => {
//   if (!chatId) throw new NotFoundException("chatId not found");

//   const message = await MessageModel.create({
//     chat: chatId,
//     content: content,
//     role: role,
//     sources,
//   });

//   return { message };

//   // const chat = await ChatModel.findOneAndUpdate(
//   //   { _id: chatId, user: userId }, // Ensure chat belongs to user
//   //   {
//   //     $push: {
//   //       messages: {
//   //         role,
//   //         content,
//   //         ...(sources && { sources }), // Conditionally add sources
//   //       },
//   //     },
//   //   },
//   //   { new: true }
//   // ).populate("project", "title");

//   // if (!chat) throw new NotFoundException("Chat not found");
//   // return { chat };
// };
