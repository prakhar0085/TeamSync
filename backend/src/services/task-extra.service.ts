import mongoose from "mongoose";
import TaskModel from "../models/task.model";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const getTaskDistributionByStatusService = async (workspaceId: string) => {
  const data = await TaskModel.aggregate([
    { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
    { $sort: { status: 1 } },
  ]);
  // Ensure all statuses present with 0 default
  const statuses = Object.values(TaskStatusEnum);
  const map = new Map<string, number>();
  data.forEach((d: any) => map.set(d.status, d.count));
  return statuses.map((s) => ({ status: s, count: map.get(s) || 0 }));
};

export const getTaskPriorityDistributionService = async (workspaceId: string) => {
  const data = await TaskModel.aggregate([
    { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
    { $project: { _id: 0, priority: "$_id", count: 1 } },
    { $sort: { priority: 1 } },
  ]);
  const priorities = Object.values(TaskPriorityEnum);
  const map = new Map<string, number>();
  data.forEach((d: any) => map.set(d.priority, d.count));
  return priorities.map((p) => ({ priority: p, count: map.get(p) || 0 }));
};

const toCsv = (rows: any[], headers: string[]) => {
  const escape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/"/g, '""');
    if (/[",\n]/.test(s)) return `"${s}"`;
    return s;
  };
  const headerRow = headers.join(",");
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
  return [headerRow, ...dataRows].join("\n");
};

export const getAllUsersTaskReportCSVService = async (workspaceId: string) => {
  const tasks = await TaskModel.find({ workspace: workspaceId })
    .populate("assignedTo", "name email")
    .populate("project", "name")
    .lean();

  const rows = tasks.map((t: any) => ({
    TaskCode: t.taskCode,
    Title: t.title,
    Description: t.description || "",
    Project: t.project?.name || "",
    Status: t.status,
    Priority: t.priority,
    AssignedTo: t.assignedTo?.name || "",
    AssignedEmail: t.assignedTo?.email || "",
    DueDate: t.dueDate ? new Date(t.dueDate).toISOString() : "",
    CreatedAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
    UpdatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : "",
  }));

  const headers = [
    "TaskCode",
    "Title",
    "Description",
    "Project",
    "Status",
    "Priority",
    "AssignedTo",
    "AssignedEmail",
    "DueDate",
    "CreatedAt",
    "UpdatedAt",
  ];

  return toCsv(rows, headers);
};

export const getDetailedTaskReportCSVService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    from?: string;
    to?: string;
  }
) => {
  const query: Record<string, any> = { workspace: workspaceId };
  if (filters.projectId) query.project = filters.projectId;
  if (filters.status && filters.status.length) query.status = { $in: filters.status };
  if (filters.priority && filters.priority.length) query.priority = { $in: filters.priority };
  if (filters.assignedTo && filters.assignedTo.length) query.assignedTo = { $in: filters.assignedTo };

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const tasks = await TaskModel.find(query)
    .populate("assignedTo", "name email")
    .populate("project", "name")
    .lean();

  const rows = tasks.map((t: any) => ({
    TaskCode: t.taskCode,
    Title: t.title,
    Description: t.description || "",
    Project: t.project?.name || "",
    Status: t.status,
    Priority: t.priority,
    AssignedTo: t.assignedTo?.name || "",
    AssignedEmail: t.assignedTo?.email || "",
    DueDate: t.dueDate ? new Date(t.dueDate).toISOString() : "",
    ChecklistCount: Array.isArray(t.checklist) ? t.checklist.length : 0,
    ChecklistDone: Array.isArray(t.checklist) ? t.checklist.filter((c: any) => c.done).length : 0,
    CreatedAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
    UpdatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : "",
  }));

  const headers = [
    "TaskCode",
    "Title",
    "Description",
    "Project",
    "Status",
    "Priority",
    "AssignedTo",
    "AssignedEmail",
    "DueDate",
    "ChecklistCount",
    "ChecklistDone",
    "CreatedAt",
    "UpdatedAt",
  ];

  return toCsv(rows, headers);
};

export const updateTaskStatusService = async (
  workspaceId: string,
  taskId: string,
  status: string
) => {
  if (!Object.values(TaskStatusEnum).includes(status as any)) {
    throw new BadRequestException("Invalid status value");
  }
  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { status },
    { new: true }
  );
  if (!updated) throw new NotFoundException("Task not found");
  return { task: updated };
};

export const addChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  title: string
) => {
  if (!title?.trim()) throw new BadRequestException("Title is required");
  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $push: { checklist: { title, done: false } } },
    { new: true }
  );
  if (!updated) throw new NotFoundException("Task not found");
  return { task: updated };
};

export const updateChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  itemId: string,
  patch: { title?: string; done?: boolean }
) => {
  const set: any = {};
  if (typeof patch.title === "string") set["checklist.$.title"] = patch.title;
  if (typeof patch.done === "boolean") set["checklist.$.done"] = patch.done;
  if (Object.keys(set).length === 0)
    throw new BadRequestException("Nothing to update");

  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId, "checklist._id": new mongoose.Types.ObjectId(itemId) },
    { $set: set },
    { new: true }
  );
  if (!updated) throw new NotFoundException("Task or checklist item not found");
  return { task: updated };
};

export const deleteChecklistItemService = async (
  workspaceId: string,
  taskId: string,
  itemId: string
) => {
  const updated = await TaskModel.findOneAndUpdate(
    { _id: taskId, workspace: workspaceId },
    { $pull: { checklist: { _id: new mongoose.Types.ObjectId(itemId) } } },
    { new: true }
  );
  if (!updated) throw new NotFoundException("Task not found");
  return { task: updated };
};