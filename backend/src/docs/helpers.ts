import { OpenAPIV3 } from "openapi-types";
import { config } from "../config/app.config";

/** Prefixes a router path with the configured API base path (default `/api`). */
export const apiPath = (path: string): string => `${config.BASE_PATH}${path}`;

/** Wraps a schema in an `application/json` request body. */
export const jsonBody = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  required = true,
): OpenAPIV3.RequestBodyObject => ({
  required,
  content: { "application/json": { schema } },
});

/**
 * Builds a JSON response. Every successful handler in this API returns a
 * `message` string alongside its payload, so it is added automatically.
 */
export const jsonResponse = (
  description: string,
  properties: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject> = {},
  messageExample = "Success",
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: messageExample },
          ...properties,
        },
      },
    },
  },
});

export const ref = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

export const responseRef = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/responses/${name}`,
});

export const paramRef = (name: string): OpenAPIV3.ReferenceObject => ({
  $ref: `#/components/parameters/${name}`,
});

/** Path parameter carrying a resource id, named `id` unless overridden. */
export const idParam = (
  description: string,
  name = "id",
): OpenAPIV3.ParameterObject => ({
  name,
  in: "path",
  required: true,
  description,
  schema: ref("ObjectId"),
});

/** Errors returned by any endpoint sitting behind the JWT guard. */
export const authErrors = {
  "401": responseRef("Unauthorized"),
  "429": responseRef("TooManyRequests"),
  "500": responseRef("InternalServerError"),
};

/**
 * Errors returned by endpoints that also run a Zod parse and a role guard.
 * Permission failures surface as 401 (`UnauthorizedException`), not 403.
 */
export const guardedErrors = {
  "400": responseRef("ValidationError"),
  "401": responseRef("Unauthorized"),
  "404": responseRef("NotFound"),
  "429": responseRef("TooManyRequests"),
  "500": responseRef("InternalServerError"),
};
