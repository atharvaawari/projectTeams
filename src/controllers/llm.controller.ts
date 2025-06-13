import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { processUserQuery } from "../services/llm.service";
import { HTTPSTATUS } from "../config/http.config";


export const handleUserQuerry = asyncHandler(
  async(req: Request, res: Response)=>{
    const { query } = req.body;

    const { data } = await processUserQuery(query);

     return res.status(HTTPSTATUS.OK).json({
      message:"Query handled Successfully",
      data: data
     })
  }
)