import { OpenAPIV3 } from "openapi-types";

const healthPayload = (status: string, database: string): OpenAPIV3.SchemaObject => ({
  type: "object",
  properties: {
    status: { type: "string", example: status },
    uptime: {
      type: "number",
      description: "Process uptime in seconds.",
      example: 1024.53,
    },
    timestamp: { type: "string", format: "date-time" },
    database: { type: "string", example: database },
  },
});

export const healthPaths: OpenAPIV3.PathsObject = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Liveness and readiness probe",
      description:
        "Reports process uptime and MongoDB connectivity. Mounted at the server " +
        "root rather than under the API base path, and deliberately registered " +
        "before the global rate limiter so uptime monitors are never throttled. " +
        "Requires no authentication.",
      operationId: "getHealth",
      security: [],
      responses: {
        "200": {
          description: "The process is up and MongoDB is connected.",
          content: {
            "application/json": { schema: healthPayload("ok", "connected") },
          },
        },
        "503": {
          description:
            "The process is up but MongoDB is not connected — the service is degraded.",
          content: {
            "application/json": { schema: healthPayload("degraded", "disconnected") },
          },
        },
      },
    },
  },
};
