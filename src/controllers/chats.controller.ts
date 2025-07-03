import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { createChatService, getUserChatsSerive } from "../services/chat.service";

interface CreateChatRequest extends Request {
  body: {
    workspaceId?: string;
    projectId?: string;
    title?: string;
  };
}

export const createChatController = asyncHandler(
  async (req: CreateChatRequest, res: Response) => {
   
    const { workspaceId , projectId, title} = req.body;

    const userId = req.user?._id;

    const { chat } = await createChatService(userId, workspaceId, projectId, title);

    return res.status(HTTPSTATUS.OK).json({
      message: "Chat created successfully",
      data: chat,
    });
  }
);

export const getUserChatsController = asyncHandler(
  async(req: Request, res: Response) => {

    const userId = req.user?._id;

    const userChats = await getUserChatsSerive(userId);
    
    return res.status(HTTPSTATUS.OK).json({
      message: "chats fetched successfully",
      data: userChats
    })

  }
)
