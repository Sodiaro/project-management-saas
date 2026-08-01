import { OpenAPIV3 } from "openapi-types";
import { apiPath, authErrors, jsonResponse, ref } from "../helpers";

export const userPaths: OpenAPIV3.PathsObject = {
  [apiPath("/user/current")]: {
    get: {
      tags: ["User"],
      summary: "Get the authenticated user",
      description:
        "Returns the profile of the bearer-token holder with `currentWorkspace` " +
        "populated. The password hash is excluded.",
      operationId: "getCurrentUser",
      responses: {
        "200": jsonResponse(
          "The authenticated user.",
          { user: ref("User") },
          "User fetch successfully",
        ),
        "400": {
          description: "The id embedded in the token no longer maps to a user.",
          content: { "application/json": { schema: ref("ErrorResponse") } },
        },
        ...authErrors,
      },
    },
  },
};
