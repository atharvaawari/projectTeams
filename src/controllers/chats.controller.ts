import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  addMessageToChatService,
  createChatService,
  getChatByIdService,
  getUserChatsSerive,
} from "../services/chat.service";

interface CreateChatRequest extends Request {
  body: {
    workspaceId?: string;
    projectId?: string;
    title?: string;
  };
}

interface AddMessageRequest extends Request {
  body: {
    content: string;
    sources?: { title: string; url: string; score?: number }[];
    role: string;
  };
}

export const createChatController = asyncHandler(
  async (req: CreateChatRequest, res: Response) => {
    const { workspaceId, projectId, title } = req.body;

    const userId = req.user?._id;

    const { chat } = await createChatService(
      userId,
      workspaceId,
      projectId,
      title
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat created successfully",
      data: chat,
    });
  }
);

export const getUserChatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const userChats = await getUserChatsSerive(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "chats fetched successfully",
      data: userChats,
    });
  }
);

export const getChatByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user?._id;

    const { chat } = await getChatByIdService(chatId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat fetched successfully",
      data: chat,
    });
  }
);

export const addMessageController = asyncHandler(
  async (req: AddMessageRequest, res: Response) => {
    const { content, sources, role } = req.body;
    const { chatId } = req.params;
    const userId = req.user?._id;

    // Add user message
    const { chat } = await addMessageToChatService(
      chatId,
      userId,
      role,
      content,
      sources
    );

    // --- Optional: Call AI service here and append response ---
    // const aiResponse = await callAIService(content);
    // await addMessageToChatService(chatId, userId, "assistant", aiResponse.content, aiResponse.sources);

    res.status(HTTPSTATUS.OK).json({
      message: "Message added successfully",
      data: chat.messages,
    });
  }
);
