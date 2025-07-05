import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { askAI } from "../services/llm.service";
import { HTTPSTATUS } from "../config/http.config";
import { handleQuerySchema, handleWorkspaceQuerySchema } from "../validation/llm.validation";
import { handleWorkspaceQueryService } from "../services/ai.service";

export const handleUserQuerry = asyncHandler(
  async (req: Request, res: Response) => {
    const { query: question } = handleQuerySchema.parse(req.body);

    // const { data } = await processUserQuery(query);

    const answer = await askAI(question);

    return res.status(HTTPSTATUS.OK).json({
      message: "Query handled Successfully",
      data: answer,
    });
  }
);

export const handleWorkspaceQuery = asyncHandler(
  async(req: Request, res: Response)=>{
    const { query, workspaceId } = handleWorkspaceQuerySchema.parse(req.body);
    const userId = req.user?._id;

    const response = await handleWorkspaceQueryService(query, userId, workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Query handled Successfully",
      data: response,
    });
  }
)
