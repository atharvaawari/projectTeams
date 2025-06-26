import ProjectModel from "../models/project.model";
import MemberModel from "../models/member.model";
import TaskModel from "../models/task.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.emun";
import {
  safeDeleteEmbedding,
  safeUpsertEmbedding,
} from "../utils/embeddingUtils";

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const { title, description, priority, status, assignedTo, dueDate } = body;

  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  if (assignedTo) {
    const isAssignedUserMember = await MemberModel.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }

  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
  });

  await task.save();

  if (!task._id) throw new NotFoundException("task id is missing");

  safeUpsertEmbedding(
    "task_embeddings",
    task._id.toString(),
    `${title} ${description || ""}`.trim(),
    {
      type: "TASK",
      workspaceId: workspaceId.toString(),
      projectId: projectId.toString(),
      status,
      priority,
      createdBy: userId.toString(),
      assignedTo: assignedTo?.toString(),
    }
  ).catch((e) => console.error("Task embedding failed:", e));

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString())
    throw new NotFoundException(
      "Project not found or does not belongs to the specified workspace"
    );

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString())
    throw new NotFoundException(
      "Task not found or does not belongs to the specified project"
    );

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  // Update embedding if title/description changed
  if (body.title || body.description) {
    safeUpsertEmbedding(
      "task_embeddings",
      taskId.toString(),
      `${updatedTask.title} ${updatedTask.description || ""}`.trim(),
      {
        type: "TASK",
        workspaceId: workspaceId.toString(),
        projectId: projectId.toString(),
        status: updatedTask.status,
        priority: updatedTask.priority,
        createdBy: updatedTask.createdBy.toString(),
        assignedTo: updatedTask.assignedTo?.toString(),
      }
    ).catch((e) => console.error("Task embedding update failed:", e));
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const querry: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) querry.project = filters.projectId;
  if (filters.status && filters.status?.length > 0)
    querry.status = { $in: filters.status };
  if (filters.priority && filters.priority?.length > 0)
    querry.priority = { $in: filters.priority };
  if (filters.assignedTo && filters.assignedTo?.length > 0)
    querry.assignedTo = { $in: filters.assignedTo };
  if (filters.keyword && filters.keyword !== undefined)
    querry.title = { $regex: filters.keyword, $options: "i" };
  if (filters.dueDate) querry.dueDate = { $eq: new Date(filters.dueDate) };

  //Pegination setUp
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(querry)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture -password")
      .populate("project", "_id emoji name"),
    TaskModel.countDocuments(querry),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  }).populate("assignedTo", "_id name profilePicture -password");

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await TaskModel.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  if(!task._id) throw new NotFoundException("No task id found");

  // Delete the associated embedding
  safeDeleteEmbedding("task_embeddings", task._id.toString()).catch((e) =>
    console.error("Task embedding deletion failed:", e)
  );

  return;
};
