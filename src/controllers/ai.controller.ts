import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { askAI } from "../services/llm.service";
import { HTTPSTATUS } from "../config/http.config";
import { getAiResponseService } from "../services/ai.service";

export const getAiResponseController = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = req.body;
    const userId = req.user?._id;

    const result = await getAiResponseService(query, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Query handled Successfully",
      data: result,
    });
  }
);
