import { OpenAPIV3 } from "openapi-types";
import { TaskPriorityEnum, TaskStatusEnum } from "../../enums/task.enum";
import {
  apiPath,
  guardedErrors,
  idParam,
  jsonBody,
  jsonResponse,
  paramRef,
  ref,
} from "../helpers";

const taskBody: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["title", "priority", "status"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 255,
      example: "Design the onboarding flow",
    },
    description: { type: "string", nullable: true, example: "Cover the empty state too" },
    priority: {
      type: "string",
      enum: Object.values(TaskPriorityEnum),
      example: TaskPriorityEnum.HIGH,
    },
    status: {
      type: "string",
      enum: Object.values(TaskStatusEnum),
      example: TaskStatusEnum.TODO,
    },
    assignedTo: {
      type: "string",
      nullable: true,
      description:
        "Id of the assignee, who must be a member of the workspace. Send `null` to leave it unassigned.",
      example: "6773b0a2f9c1d2e3a4b5c6d7",
    },
    dueDate: {
      type: "string",
      description: "Any string `Date.parse` accepts; ISO 8601 recommended.",
      example: "2026-09-30T17:00:00.000Z",
    },
  },
};

const taskIdParam = idParam("Task id.");

const csvFilter = (
  name: string,
  description: string,
  values: string[],
): OpenAPIV3.ParameterObject => ({
  name,
  in: "query",
  required: false,
  description: `${description} Comma-separated for multiple values, e.g. \`${values
    .slice(0, 2)
    .join(",")}\`.`,
  schema: { type: "string" },
});

export const taskPaths: OpenAPIV3.PathsObject = {
  [apiPath("/task/project/{projectId}/workspace/{workspaceId}/create")]: {
    post: {
      tags: ["Task"],
      summary: "Create a task",
      description:
        "Creates a task in the project with a generated `taskCode`. If `assignedTo` " +
        "is set, that user must already be a member of the workspace. Requires the " +
        "`CREATE_TASK` permission (all roles have it). Note this returns **200**, " +
        "not 201.",
      operationId: "createTask",
      parameters: [paramRef("ProjectIdPath"), paramRef("WorkspaceIdPath")],
      requestBody: jsonBody(taskBody),
      responses: {
        "200": jsonResponse(
          "Task created.",
          { task: ref("Task") },
          "Task created successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/task/workspace/{workspaceId}/all")]: {
    get: {
      tags: ["Task"],
      summary: "List and filter tasks in a workspace",
      description:
        "Returns tasks newest-first with `assignedTo` and `project` populated. All " +
        "filters are optional and combine with AND. Requires the `VIEW_ONLY` " +
        "permission.",
      operationId: "getAllTasks",
      parameters: [
        paramRef("WorkspaceIdPath"),
        {
          name: "projectId",
          in: "query",
          required: false,
          description: "Restrict to a single project.",
          schema: { type: "string" },
        },
        csvFilter("status", "Match any of these statuses.", Object.values(TaskStatusEnum)),
        csvFilter(
          "priority",
          "Match any of these priorities.",
          Object.values(TaskPriorityEnum),
        ),
        csvFilter("assignedTo", "Match any of these assignee ids.", [
          "6773b0a2f9c1d2e3a4b5c6d7",
          "6773b0a2f9c1d2e3a4b5c6d8",
        ]),
        {
          name: "keyword",
          in: "query",
          required: false,
          description: "Case-insensitive substring match on the task title.",
          schema: { type: "string", example: "onboarding" },
        },
        {
          name: "dueDate",
          in: "query",
          required: false,
          description:
            "Exact due-date match — the stored timestamp must equal this instant, " +
            "so a date-only value matches only tasks due at midnight UTC.",
          schema: { type: "string", format: "date-time" },
        },
        paramRef("PageSize"),
        paramRef("PageNumber"),
      ],
      responses: {
        "200": jsonResponse(
          "A page of matching tasks.",
          {
            tasks: { type: "array", items: ref("Task") },
            pagination: ref("Pagination"),
          },
          "All tasks fetched successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/task/{id}/project/{projectId}/workspace/{workspaceId}")]: {
    get: {
      tags: ["Task"],
      summary: "Get a task by id",
      description:
        "Returns the task with `assignedTo` populated. 404s if the project does not " +
        "belong to the workspace, or the task does not belong to the project. " +
        "Requires the `VIEW_ONLY` permission.",
      operationId: "getTaskById",
      parameters: [taskIdParam, paramRef("ProjectIdPath"), paramRef("WorkspaceIdPath")],
      responses: {
        "200": jsonResponse(
          "The task.",
          { task: ref("Task") },
          "Task fetched successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/task/{id}/project/{projectId}/workspace/{workspaceId}/update")]: {
    put: {
      tags: ["Task"],
      summary: "Update a task",
      description:
        "Replaces the task's editable fields — `title`, `priority` and `status` are " +
        "required, so send the full object rather than a partial patch. Requires the " +
        "`EDIT_TASK` permission (all roles have it).",
      operationId: "updateTask",
      parameters: [taskIdParam, paramRef("ProjectIdPath"), paramRef("WorkspaceIdPath")],
      requestBody: jsonBody(taskBody),
      responses: {
        "200": jsonResponse(
          "Task updated.",
          { task: ref("Task") },
          "Task updated successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/task/{id}/workspace/{workspaceId}/delete")]: {
    delete: {
      tags: ["Task"],
      summary: "Delete a task",
      description:
        "Deletes the task from the workspace. Requires the `DELETE_TASK` permission " +
        "(OWNER and ADMIN). Note the project id is not part of this route.",
      operationId: "deleteTask",
      parameters: [taskIdParam, paramRef("WorkspaceIdPath")],
      responses: {
        "200": jsonResponse("Task deleted.", {}, "Task deleted successfully"),
        ...guardedErrors,
      },
    },
  },
};
