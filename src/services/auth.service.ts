import mongoose from "mongoose";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import MemberModel from "../models/member.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { abort } from "process";
import ChatModel from "../models/chat.model";

export const loginOrCreateAccountService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, displayName, email, picture } = data;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Started Session...");

    let user = await UserModel.findOne({ email });

    if (!user) {
      //1. create a new user if it doesnt exist

      user = new UserModel({
        email,
        name: displayName,
        profilePicture: picture || null,
      });
      await user.save({ session });

      const account = new AccountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await account.save({ session });

      //3. Create a new workspace for new user
      const workspace = new WorkspaceModel({
        name: `My Workspace`,
        description: `Workspace created for ${user.name}`,
        owner: user._id,
      });
      await workspace.save({ session });

      const ownerRole = await RoleModel.findOne({
        name: Roles.OWNER,
      }).session(session);

      if (!ownerRole) {
        throw new NotFoundException("Owner role not found");
      }

      const member = new MemberModel({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
        joinedAt: new Date(),
      });
      await member.save({ session });

      user.currentWorkSpace = workspace._id as mongoose.Types.ObjectId;
      await user.save({ session });

      const chat = new ChatModel({
        user: user._id,
        title: "Welcome Chat",
        messages: [
          {
            content: "Hello! I'm your AI Manager. How can I help you today?",
            role: "assistant",
            timestamp: new Date(),
          },
        ],
      });
      await chat.save({ session });

      user.chats = [chat._id as mongoose.Types.ObjectId];
      await user.save({ session });
    }
    await session.commitTransaction();
    session.endSession();
    console.log("End session...");

    return { user };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  } finally {
    session.endSession();
  }
};

export const registerUserSevice = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  const { email, name, password } = body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await UserModel.findOne({ email }).session(session);

    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const user = new UserModel({
      email,
      name,
      password,
    });

    await user.save({ session });

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });

    await account.save({ session });

    const workspace = new WorkspaceModel({
      name: `My Workspace`,
      description: `Workspace created for ${user.name}`,
      owner: user._id,
    });
    await workspace.save({ session });

    const ownerRole = await RoleModel.findOne({
      name: Roles.OWNER,
    }).session(session);

    if (!ownerRole) {
      throw new NotFoundException("Owner role not found");
    }

    const member = new MemberModel({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
      joinedAt: new Date(),
    });
    await member.save({ session });

    user.currentWorkSpace = workspace._id as mongoose.Types.ObjectId;
    await user.save({ session });

    const chat = new ChatModel({
      user: user._id,
      title: "Welcome Chat",
      messages: [
        {
          content: "Hello! I'm your AI Manager. How can I help you today?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
    });
    await chat.save({ session });

    user.chats = [chat._id as mongoose.Types.ObjectId];
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
    console.log("End session...");

    return {
      userId: user._id,
      workspaceId: workspace._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    throw error;
  }
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: String;
  password: string;
  provider?: string;
}) => {
  const account = await AccountModel.findOne({ provider, providerId: email });

  if (!account) throw new NotFoundException("Invalid email or password.");

  const user = await UserModel.findById(account.userId);

  if (!user)
    throw new NotFoundException("User not found for the given account.");

  const isMatch = await user.comparePassward(password);

  if (!isMatch) throw new UnauthorizedException("Invalid email or password");

  return user.omitPassword();
};
