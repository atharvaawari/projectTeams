import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { config } from "../config/app.config";
import { registerSchema } from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import { registerUserSevice } from "../services/auth.service";

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const currentWorkSpace = req.user?.currentWorkSpace;

    if (!currentWorkSpace) {
      return res.redirect(
        `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`
      );
    }
    return res.redirect(
      `${config.FRONTEND_ORIGIN}/workspace/${currentWorkSpace}`
    );
  }
);

export const registerUserController = asyncHandler( async(req: Request, res:Response)=>{
  
  const body = registerSchema.parse({ ...req.body });

  await registerUserSevice(body);

  return res.status(HTTPSTATUS.CREATED).json({
    message:"User created successfully."
  })
})
