import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { NotFoundException } from "../utils/appError";

export const getRelevantContext = async (
  query: string,
  workspaceId: string
): Promise<{
  projects: any[];
  tasks: any[];
  members: any[];
}> => {
  try {
    const [projects, tasks, members] = await Promise.all([
      ProjectModel.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      TaskModel.find({ workspace: workspaceId })
        .lean()
        .exec(),
      MemberModel.find({ workspaceId })
        .populate("userId", "name email profilePicture -password")
        .populate("role", "name")
        .lean()
        .exec(),
    ]);

    // const projects = await ProjectModel.find({workspace: workspaceId}).sort({createdAt: -1}).lean().exec();
    // const tasks = await TaskModel.find({workspace: workspaceId}).sort({createdAt: -1}).lean().exec();
    // const members = await MemberModel.find({workspaceId}).sort({createdAt: -1}).lean().exec();

    if (!projects || !tasks || !members) {
      throw new NotFoundException("Could not fetch all workspace data");
    }
    
    return {
      projects: projects || [],
      tasks: tasks || [],
      members: members || [],
    };

  } catch (error) {
    console.error("Error fetching workspace context:", error);
    throw error; // Re-throw the error for the calling function to handle
  }
};