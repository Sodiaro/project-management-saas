import { OpenAPIV3 } from "openapi-types";
import {
  apiPath,
  guardedErrors,
  idParam,
  jsonBody,
  jsonResponse,
  paramRef,
  ref,
} from "../helpers";

const projectBody: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255, example: "Mobile app" },
    description: {
      type: "string",
      nullable: true,
      example: "iOS and Android client",
    },
    emoji: {
      type: "string",
      description: "Defaults to 🏬 when omitted.",
      example: "🚀",
    },
  },
};

const projectIdParam = idParam("Project id.");

export const projectPaths: OpenAPIV3.PathsObject = {
  [apiPath("/project/workspace/{workspaceId}/create")]: {
    post: {
      tags: ["Project"],
      summary: "Create a project",
      description:
        "Creates a project inside the workspace, owned by the caller. Requires the " +
        "`CREATE_PROJECT` permission (OWNER and ADMIN).",
      operationId: "createProject",
      parameters: [paramRef("WorkspaceIdPath")],
      requestBody: jsonBody(projectBody),
      responses: {
        "201": jsonResponse(
          "Project created.",
          { project: ref("Project") },
          "Project created successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/project/workspace/{workspaceId}/all")]: {
    get: {
      tags: ["Project"],
      summary: "List projects in a workspace",
      description:
        "Returns projects newest-first with `createdBy` populated, paginated. " +
        "Requires the `VIEW_ONLY` permission (all roles have it).",
      operationId: "getAllProjectsInWorkspace",
      parameters: [
        paramRef("WorkspaceIdPath"),
        paramRef("PageSize"),
        paramRef("PageNumber"),
      ],
      responses: {
        "200": jsonResponse(
          "A page of projects.",
          {
            projects: { type: "array", items: ref("Project") },
            pagination: {
              allOf: [ref("Pagination")],
              description: "Also carries `limit`, mirroring `pageSize`.",
            } as unknown as OpenAPIV3.SchemaObject,
          },
          "Project fetched successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/project/{id}/workspace/{workspaceId}")]: {
    get: {
      tags: ["Project"],
      summary: "Get a project by id",
      description:
        "Returns a trimmed project (`_id`, `emoji`, `name`, `description`) and 404s " +
        "if the project does not belong to the given workspace. Requires the " +
        "`VIEW_ONLY` permission.",
      operationId: "getProjectByIdAndWorkspaceId",
      parameters: [projectIdParam, paramRef("WorkspaceIdPath")],
      responses: {
        "200": jsonResponse(
          "The project.",
          { project: ref("Project") },
          "Project fetched successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/project/{id}/workspace/{workspaceId}/analytics")]: {
    get: {
      tags: ["Project"],
      summary: "Get project task analytics",
      description:
        "Counts the project's tasks, those overdue (due date in the past and not " +
        "`DONE`), and those completed. Requires the `VIEW_ONLY` permission.",
      operationId: "getProjectAnalytics",
      parameters: [projectIdParam, paramRef("WorkspaceIdPath")],
      responses: {
        "200": jsonResponse(
          "Task counts for the project.",
          { analytics: ref("TaskAnalytics") },
          "Project analytics retrieved successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/project/{id}/workspace/{workspaceId}/update")]: {
    put: {
      tags: ["Project"],
      summary: "Update a project",
      description:
        "Updates the project's name, description and emoji. Requires the " +
        "`EDIT_PROJECT` permission (OWNER and ADMIN).",
      operationId: "updateProject",
      parameters: [projectIdParam, paramRef("WorkspaceIdPath")],
      requestBody: jsonBody(projectBody),
      responses: {
        "200": jsonResponse(
          "Project updated.",
          { project: ref("Project") },
          "Project updated successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/project/{id}/workspace/{workspaceId}/delete")]: {
    delete: {
      tags: ["Project"],
      summary: "Delete a project",
      description:
        "Deletes the project and every task belonging to it. Requires the " +
        "`DELETE_PROJECT` permission (OWNER and ADMIN).",
      operationId: "deleteProject",
      parameters: [projectIdParam, paramRef("WorkspaceIdPath")],
      responses: {
        "200": jsonResponse("Project deleted.", {}, "Project deleted successfully"),
        ...guardedErrors,
      },
    },
  },
};
