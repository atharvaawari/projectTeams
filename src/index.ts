import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";

import isAuthenticated from "./middlewares/isAuthenticated";
import workspaceRoute from "./routes/workspace.route";
import memberRoute from "./routes/member.route";
import projectRoute from "./routes/project.route";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // throw new BadRequestException("This is a bad req", ErrorCodeEnum.ACCESS_UNAUTHORIZED);
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Teams",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoute);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoute);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoute);


app.use(errorHandler);

connectDatabase().then(() => {
  app.listen(config.PORT, () => {
    console.log(
      `Sever is listening on: http://localhost:${config.PORT} in ${config.NODE_ENV}`
    );
  });
});
