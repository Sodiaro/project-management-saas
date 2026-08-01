import { OpenAPIV3 } from "openapi-types";
import { ProviderEnum } from "../enums/account-provider.enum";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Permissions, Roles } from "../enums/role.enum";
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";

const objectId: OpenAPIV3.SchemaObject = {
  type: "string",
  description: "MongoDB ObjectId",
  example: "6773b0a2f9c1d2e3a4b5c6d7",
};

const timestamps: Record<string, OpenAPIV3.SchemaObject> = {
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
};

export const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "JWT issued by `POST /auth/login` (as `access_token`) or by the Google " +
      "callback redirect. Send it as `Authorization: Bearer <token>`.",
  },
};

export const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  ObjectId: objectId,

  Role: {
    type: "object",
    description: "A role and the permissions it grants inside a workspace.",
    properties: {
      _id: objectId,
      name: { type: "string", enum: Object.values(Roles), example: Roles.OWNER },
      permissions: {
        type: "array",
        items: { type: "string", enum: Object.values(Permissions) },
        example: [Permissions.CREATE_PROJECT, Permissions.VIEW_ONLY],
      },
      ...timestamps,
    },
  },

  User: {
    type: "object",
    description: "An application user. The password hash is never returned.",
    properties: {
      _id: objectId,
      name: { type: "string", example: "Ada Lovelace" },
      email: { type: "string", format: "email", example: "ada@example.com" },
      profilePicture: {
        type: "string",
        nullable: true,
        example: "https://lh3.googleusercontent.com/a/default-user",
      },
      isActive: { type: "boolean", example: true },
      lastLogin: { type: "string", format: "date-time", nullable: true },
      currentWorkspace: {
        nullable: true,
        description:
          "Workspace id, or the populated workspace on `GET /user/current`.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/Workspace" },
        ],
      },
      ...timestamps,
    },
  },

  UserSummary: {
    type: "object",
    description: "Trimmed user projection embedded in members, tasks and projects.",
    properties: {
      _id: objectId,
      name: { type: "string", example: "Ada Lovelace" },
      email: { type: "string", format: "email", example: "ada@example.com" },
      profilePicture: { type: "string", nullable: true },
    },
  },

  Account: {
    type: "object",
    description:
      "Link between a user and an authentication provider. Created internally " +
      "during registration and Google sign-in.",
    properties: {
      _id: objectId,
      userId: objectId,
      provider: {
        type: "string",
        enum: Object.values(ProviderEnum),
        example: ProviderEnum.EMAIL,
      },
      providerId: {
        type: "string",
        description: "Email for EMAIL accounts, the `sub` claim for Google accounts.",
        example: "ada@example.com",
      },
      tokenExpiry: { type: "string", format: "date-time", nullable: true },
      ...timestamps,
    },
  },

  Workspace: {
    type: "object",
    properties: {
      _id: objectId,
      name: { type: "string", example: "Acme Inc" },
      description: { type: "string", nullable: true, example: "Company-wide workspace" },
      owner: objectId,
      inviteCode: {
        type: "string",
        description: "Share this code to let others join via `POST /member/workspace/{inviteCode}/join`.",
        example: "a1b2c3d4",
      },
      ...timestamps,
    },
  },

  WorkspaceWithMembers: {
    allOf: [
      { $ref: "#/components/schemas/Workspace" },
      {
        type: "object",
        properties: {
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/Member" },
          },
        },
      },
    ],
  } as unknown as OpenAPIV3.SchemaObject,

  Member: {
    type: "object",
    description: "Membership record joining a user to a workspace with a role.",
    properties: {
      _id: objectId,
      userId: {
        description: "User id, or the populated user summary on member listings.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/UserSummary" },
        ],
      },
      workspaceId: objectId,
      role: {
        description: "Role id, or the populated role.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/Role" },
        ],
      },
      joinedAt: { type: "string", format: "date-time" },
      ...timestamps,
    },
  },

  Project: {
    type: "object",
    properties: {
      _id: objectId,
      name: { type: "string", example: "Mobile app" },
      description: { type: "string", nullable: true, example: "iOS and Android client" },
      emoji: { type: "string", example: "🚀" },
      workspace: objectId,
      createdBy: {
        description: "Creator id, or the populated user summary on project listings.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/UserSummary" },
        ],
      },
      ...timestamps,
    },
  },

  ProjectSummary: {
    type: "object",
    description: "Trimmed project projection embedded in task listings.",
    properties: {
      _id: objectId,
      name: { type: "string", example: "Mobile app" },
      emoji: { type: "string", example: "🚀" },
    },
  },

  Task: {
    type: "object",
    properties: {
      _id: objectId,
      taskCode: {
        type: "string",
        description: "Human-friendly identifier generated on creation.",
        example: "task-a1b2c3",
      },
      title: { type: "string", example: "Design the onboarding flow" },
      description: { type: "string", nullable: true },
      project: {
        description: "Project id, or the populated project summary on task listings.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/ProjectSummary" },
        ],
      },
      workspace: objectId,
      status: {
        type: "string",
        enum: Object.values(TaskStatusEnum),
        example: TaskStatusEnum.TODO,
      },
      priority: {
        type: "string",
        enum: Object.values(TaskPriorityEnum),
        example: TaskPriorityEnum.MEDIUM,
      },
      assignedTo: {
        nullable: true,
        description: "Assignee id, or the populated user summary on task listings.",
        oneOf: [
          { $ref: "#/components/schemas/ObjectId" },
          { $ref: "#/components/schemas/UserSummary" },
        ],
      },
      createdBy: objectId,
      dueDate: { type: "string", format: "date-time", nullable: true },
      ...timestamps,
    },
  },

  Pagination: {
    type: "object",
    properties: {
      totalCount: { type: "integer", example: 42 },
      pageSize: { type: "integer", example: 10 },
      pageNumber: { type: "integer", example: 1 },
      totalPages: { type: "integer", example: 5 },
      skip: { type: "integer", example: 0 },
    },
  },

  TaskAnalytics: {
    type: "object",
    properties: {
      totalTasks: { type: "integer", example: 42 },
      overdueTasks: {
        type: "integer",
        description: "Tasks past their due date that are not DONE.",
        example: 3,
      },
      completedTasks: { type: "integer", example: 21 },
    },
  },

  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Resource not found" },
      errorCode: {
        type: "string",
        enum: Object.values(ErrorCodeEnum),
        example: ErrorCodeEnum.RESOURCE_NOT_FOUND,
      },
      error: {
        type: "string",
        description: "Underlying error message, present on unhandled 500s only.",
      },
    },
    required: ["message"],
  },

  ValidationErrorResponse: {
    type: "object",
    description: "Returned when a Zod schema rejects the request body or params.",
    properties: {
      message: { type: "string", example: "Validation failed" },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "Invalid email address" },
          },
        },
      },
      errorCode: { type: "string", example: ErrorCodeEnum.VALIDATION_ERROR },
    },
  },
};

const errorResponse = (
  description: string,
  schema = "ErrorResponse",
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

export const responses: Record<string, OpenAPIV3.ResponseObject> = {
  BadRequest: errorResponse("Malformed request or failed business rule."),
  ValidationError: errorResponse(
    "Request body or path parameters failed validation.",
    "ValidationErrorResponse",
  ),
  Unauthorized: errorResponse(
    "Missing, expired or invalid bearer token; the caller is not a member of the " +
      "workspace; or their role lacks the required permission. Permission failures " +
      "carry `errorCode: ACCESS_UNAUTHORIZED` — this API returns 401 rather than 403 " +
      "for authorization failures.",
  ),
  NotFound: errorResponse("The requested resource does not exist."),
  TooManyRequests: errorResponse(
    "Rate limit exceeded. 300 requests per 15 minutes globally, 20 per 15 minutes on `/auth`.",
  ),
  InternalServerError: errorResponse("Unexpected server error."),
};

export const parameters: Record<string, OpenAPIV3.ParameterObject> = {
  WorkspaceIdPath: {
    name: "workspaceId",
    in: "path",
    required: true,
    description: "Id of the workspace that owns the resource.",
    schema: { $ref: "#/components/schemas/ObjectId" },
  },
  ProjectIdPath: {
    name: "projectId",
    in: "path",
    required: true,
    description: "Id of the project that owns the resource.",
    schema: { $ref: "#/components/schemas/ObjectId" },
  },
  PageSize: {
    name: "pageSize",
    in: "query",
    required: false,
    description: "Items per page. Defaults to 10 when omitted or unparseable.",
    schema: { type: "integer", minimum: 1, default: 10 },
  },
  PageNumber: {
    name: "pageNumber",
    in: "query",
    required: false,
    description: "1-based page index. Defaults to 1 when omitted or unparseable.",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
};
