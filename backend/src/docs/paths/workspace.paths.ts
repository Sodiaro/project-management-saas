import { OpenAPIV3 } from "openapi-types";
import {
  apiPath,
  authErrors,
  guardedErrors,
  idParam,
  jsonBody,
  jsonResponse,
  ref,
} from "../helpers";

const nameAndDescription: OpenAPIV3.SchemaObject = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255, example: "Acme Inc" },
    description: {
      type: "string",
      nullable: true,
      example: "Company-wide workspace",
    },
  },
};

export const workspacePaths: OpenAPIV3.PathsObject = {
  [apiPath("/workspace/create/new")]: {
    post: {
      tags: ["Workspace"],
      summary: "Create a workspace",
      description:
        "Creates a workspace with a generated invite code, makes the caller its " +
        "OWNER, and sets it as their `currentWorkspace`. Any authenticated user may " +
        "call this — no role check applies since the workspace does not exist yet.",
      operationId: "createWorkspace",
      requestBody: jsonBody(nameAndDescription),
      responses: {
        "201": jsonResponse(
          "Workspace created.",
          { workspace: ref("Workspace") },
          "Workspace created successfully",
        ),
        "400": { $ref: "#/components/responses/ValidationError" },
        "404": {
          description: "The seeded OWNER role is missing — run `npm run seed`.",
          content: { "application/json": { schema: ref("ErrorResponse") } },
        },
        ...authErrors,
      },
    },
  },

  [apiPath("/workspace/all")]: {
    get: {
      tags: ["Workspace"],
      summary: "List workspaces the caller belongs to",
      description:
        "Returns every workspace the caller holds a membership in, regardless of role.",
      operationId: "getAllWorkspacesUserIsMember",
      responses: {
        "200": jsonResponse(
          "Workspaces the caller is a member of.",
          {
            workspaces: {
              type: "array",
              items: ref("Workspace"),
            },
          },
          "User workspaces fetched successfully",
        ),
        ...authErrors,
      },
    },
  },

  [apiPath("/workspace/{id}")]: {
    get: {
      tags: ["Workspace"],
      summary: "Get a workspace by id",
      description:
        "Returns the workspace together with its membership records, each with its " +
        "role populated. Requires membership of the workspace; no further permission " +
        "is checked.",
      operationId: "getWorkspaceById",
      parameters: [idParam("Workspace id.")],
      responses: {
        "200": jsonResponse(
          "The workspace and its members.",
          { workspace: ref("WorkspaceWithMembers") },
          "Workspace fetched successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/workspace/members/{id}")]: {
    get: {
      tags: ["Workspace"],
      summary: "List workspace members and assignable roles",
      description:
        "Returns every member with their user summary and role name, plus the full " +
        "catalogue of roles — use the role ids when calling the change-role endpoint. " +
        "Requires the `VIEW_ONLY` permission (OWNER, ADMIN and MEMBER all have it).",
      operationId: "getWorkspaceMembers",
      parameters: [idParam("Workspace id.")],
      responses: {
        "200": jsonResponse(
          "Members and the roles that can be assigned.",
          {
            members: { type: "array", items: ref("Member") },
            roles: {
              type: "array",
              description: "All roles defined in the system, as `{ _id, name }`.",
              items: ref("Role"),
            },
          },
          "Workspace members retrieved successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/workspace/analytics/{id}")]: {
    get: {
      tags: ["Workspace"],
      summary: "Get workspace task analytics",
      description:
        "Counts every task in the workspace, those overdue (due date in the past and " +
        "not `DONE`), and those completed. Requires the `VIEW_ONLY` permission.",
      operationId: "getWorkspaceAnalytics",
      parameters: [idParam("Workspace id.")],
      responses: {
        "200": jsonResponse(
          "Task counts for the workspace.",
          { analytics: ref("TaskAnalytics") },
          "Workspace analytics retrieved successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/workspace/update/{id}")]: {
    put: {
      tags: ["Workspace"],
      summary: "Update a workspace",
      description:
        "Updates the workspace name and description. Requires the `EDIT_WORKSPACE` " +
        "permission, which only OWNER holds.",
      operationId: "updateWorkspaceById",
      parameters: [idParam("Workspace id.")],
      requestBody: jsonBody(nameAndDescription),
      responses: {
        "200": jsonResponse(
          "Workspace updated.",
          { workspace: ref("Workspace") },
          "Workspace updated successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/workspace/change/member/role/{id}")]: {
    put: {
      tags: ["Workspace"],
      summary: "Change a member's role",
      description:
        "Reassigns the role of one member of the workspace. Requires the " +
        "`CHANGE_MEMBER_ROLE` permission, which only OWNER holds. Fetch valid " +
        "`roleId` values from `GET /workspace/members/{id}`.",
      operationId: "changeWorkspaceMemberRole",
      parameters: [idParam("Workspace id.")],
      requestBody: jsonBody({
        type: "object",
        required: ["roleId", "memberId"],
        properties: {
          roleId: {
            allOf: [ref("ObjectId")],
            description: "Id of the role to assign.",
          } as unknown as OpenAPIV3.SchemaObject,
          memberId: {
            allOf: [ref("ObjectId")],
            description: "Id of the **user** whose membership is being changed.",
          } as unknown as OpenAPIV3.SchemaObject,
        },
      }),
      responses: {
        "200": jsonResponse(
          "Role reassigned.",
          { member: ref("Member") },
          "Member Role changed successfully",
        ),
        ...guardedErrors,
      },
    },
  },

  [apiPath("/workspace/delete/{id}")]: {
    delete: {
      tags: ["Workspace"],
      summary: "Delete a workspace",
      description:
        "Deletes the workspace along with all of its projects, tasks and memberships " +
        "in a single transaction. If the caller's `currentWorkspace` was the deleted " +
        "one it moves to another of their workspaces, or becomes `null`. Requires the " +
        "`DELETE_WORKSPACE` permission, which only OWNER holds.",
      operationId: "deleteWorkspaceById",
      parameters: [idParam("Workspace id.")],
      responses: {
        "200": jsonResponse(
          "Workspace deleted.",
          {
            currentWorkspace: {
              nullable: true,
              description: "The caller's workspace after the deletion, if any.",
              allOf: [ref("ObjectId")],
            } as unknown as OpenAPIV3.SchemaObject,
          },
          "Workspace deleted successfully",
        ),
        ...guardedErrors,
      },
    },
  },
};
