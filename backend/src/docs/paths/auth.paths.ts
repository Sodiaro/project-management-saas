import { OpenAPIV3 } from "openapi-types";
import { apiPath, jsonBody, jsonResponse, ref, responseRef } from "../helpers";

const authErrors = {
  "400": responseRef("ValidationError"),
  "429": responseRef("TooManyRequests"),
  "500": responseRef("InternalServerError"),
};

export const authPaths: OpenAPIV3.PathsObject = {
  [apiPath("/auth/register")]: {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates a user, an EMAIL provider account, a personal workspace named " +
        "\"My Workspace\", and an OWNER membership in it — all in one transaction. " +
        "No token is returned; call `POST /auth/login` afterwards.",
      operationId: "registerUser",
      security: [],
      requestBody: jsonBody({
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 255, example: "Ada Lovelace" },
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            example: "ada@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 4,
            description: "Hashed with bcrypt before storage.",
            example: "s3cret",
          },
        },
      }),
      responses: {
        "201": jsonResponse("User created.", {}, "User created successfully"),
        "400": {
          description:
            "Validation failed, or an account already exists for this email.",
          content: {
            "application/json": {
              schema: {
                oneOf: [ref("ValidationErrorResponse"), ref("ErrorResponse")],
              },
            },
          },
        },
        "429": responseRef("TooManyRequests"),
        "500": responseRef("InternalServerError"),
      },
    },
  },

  [apiPath("/auth/login")]: {
    post: {
      tags: ["Auth"],
      summary: "Log in with email and password",
      description:
        "Verifies credentials with the Passport local strategy and returns a signed " +
        "JWT. Send the returned `access_token` as `Authorization: Bearer <token>` on " +
        "every other endpoint.",
      operationId: "login",
      security: [],
      requestBody: jsonBody({
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ada@example.com" },
          password: { type: "string", format: "password", example: "s3cret" },
        },
      }),
      responses: {
        "200": jsonResponse(
          "Credentials accepted.",
          {
            access_token: {
              type: "string",
              description: "JWT signed with HS256, audience `user`. Expires per JWT_EXPIRES_IN (default 1 day).",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: ref("User"),
          },
          "Logged in successfully",
        ),
        "401": {
          description: "Invalid email or password.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Invalid email or password" },
                },
              },
            },
          },
        },
        ...authErrors,
      },
    },
  },

  [apiPath("/auth/logout")]: {
    post: {
      tags: ["Auth"],
      summary: "Log out",
      description:
        "Clears the Passport login state and the session cookie. Because " +
        "authentication is stateless JWT, an already-issued `access_token` stays " +
        "valid until it expires — clients must discard it themselves.",
      operationId: "logout",
      security: [],
      responses: {
        "200": jsonResponse("Session cleared.", {}, "Logged out successfully"),
        "429": responseRef("TooManyRequests"),
        "500": responseRef("InternalServerError"),
      },
    },
  },

  [apiPath("/auth/google")]: {
    get: {
      tags: ["Auth"],
      summary: "Start Google OAuth sign-in",
      description:
        "Redirects the browser to Google's consent screen requesting the `profile` " +
        "and `email` scopes. Open this URL in a browser — it is not callable over " +
        "XHR because the response is a cross-origin redirect.",
      operationId: "googleAuth",
      security: [],
      responses: {
        "302": {
          description: "Redirect to Google's OAuth consent screen.",
          headers: {
            Location: {
              description: "Google authorization URL.",
              schema: { type: "string", format: "uri" },
            },
          },
        },
        "429": responseRef("TooManyRequests"),
        "500": responseRef("InternalServerError"),
      },
    },
  },

  [apiPath("/auth/google/callback")]: {
    get: {
      tags: ["Auth"],
      summary: "Google OAuth callback",
      description:
        "Called by Google, not by clients. On success the user (and, for a " +
        "first-time sign-in, a default workspace and OWNER membership) is created, " +
        "then the browser is redirected to `FRONTEND_GOOGLE_CALLBACK_URL` with the " +
        "JWT in the query string. On failure it redirects to the same URL with " +
        "`status=failure` and no token.",
      operationId: "googleAuthCallback",
      security: [],
      parameters: [
        {
          name: "code",
          in: "query",
          required: false,
          description: "Authorization code issued by Google.",
          schema: { type: "string" },
        },
        {
          name: "state",
          in: "query",
          required: false,
          description: "Opaque state value round-tripped through Google.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "302": {
          description:
            "Redirect to the frontend callback URL carrying `status`, and on " +
            "success `access_token` plus `current_workspace`.",
          headers: {
            Location: {
              description:
                "e.g. `https://app.example.com/google/oauth/callback" +
                "?status=success&access_token=<jwt>&current_workspace=<id>`",
              schema: { type: "string", format: "uri" },
            },
          },
        },
        "429": responseRef("TooManyRequests"),
        "500": responseRef("InternalServerError"),
      },
    },
  },
};
