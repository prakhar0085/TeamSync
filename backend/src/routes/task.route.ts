import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  getTaskDistributionController,
  downloadAllUsersTaskReportController,
  downloadDetailedTaskReportController,
  updateTaskStatusController,
  addChecklistItemController,
  updateChecklistItemController,
  deleteChecklistItemController,
} from "../controllers/task.controller";

const taskRoutes = Router();

// Create / Update / Delete / Get
taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController);

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);

taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

// Distributions for dashboard charts
taskRoutes.get(
  "/workspace/:workspaceId/distributions",
  getTaskDistributionController
);

// Reports (CSV downloads)
taskRoutes.get(
  "/workspace/:workspaceId/report/all-tasks",
  downloadAllUsersTaskReportController
);

taskRoutes.get(
  "/workspace/:workspaceId/report/detailed",
  downloadDetailedTaskReportController
);

// Quick status update
taskRoutes.put(
  "/:taskId/workspace/:workspaceId/status",
  updateTaskStatusController
);

// Checklist operations
taskRoutes.post(
  "/:taskId/workspace/:workspaceId/checklist",
  addChecklistItemController
);

taskRoutes.patch(
  "/:taskId/workspace/:workspaceId/checklist/:itemId",
  updateChecklistItemController
);

taskRoutes.delete(
  "/:taskId/workspace/:workspaceId/checklist/:itemId",
  deleteChecklistItemController
);

export default taskRoutes;
