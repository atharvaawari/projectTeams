import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getAiResponseService } from "../services/ai.service";

export const getAiResponseController = asyncHandler(
  async (req: Request, res: Response) => {
    const { query, chatId } = req.body;
    const userId = req.user?._id;

    console.log("body....", req.body);

    const result = await getAiResponseService(query, chatId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Query handled Successfully",
      data: result,
    });
  }
);
