import { OpenAPIV3 } from "openapi-types";
import { config } from "../config/app.config";
import { parameters, responses, schemas, securitySchemes } from "./components";
import { authPaths } from "./paths/auth.paths";
import { healthPaths } from "./paths/health.paths";
import { memberPaths } from "./paths/member.paths";
import { projectPaths } from "./paths/project.paths";
import { taskPaths } from "./paths/task.paths";
import { userPaths } from "./paths/user.paths";
import { workspacePaths } from "./paths/workspace.paths";

const description = `
REST API for the TaskFlow project-management SaaS: workspaces, their members,
projects, and tasks.

`.trim();

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "TaskFlow API",
    version: "1.0.0",
    description,
    license: { name: "ISC" },
  },
  servers: [
    { url: "/", description: "This host" },
    {
      url: `http://localhost:${config.PORT}`,
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Liveness and readiness." },
    { name: "Auth", description: "Registration, login and Google OAuth." },
    { name: "User", description: "The authenticated user's own profile." },
    {
      name: "Workspace",
      description:
        "Workspaces, their members' roles, and workspace-wide analytics.",
    },
    { name: "Member", description: "Joining a workspace by invite code." },
    { name: "Project", description: "Projects within a workspace." },
    { name: "Task", description: "Tasks within a project." },
  ],
  security: [{ bearerAuth: [] }],
  components: { securitySchemes, schemas, parameters, responses },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...userPaths,
    ...workspacePaths,
    ...memberPaths,
    ...projectPaths,
    ...taskPaths,
  },
};
