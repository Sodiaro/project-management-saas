import { OpenAPIV3 } from "openapi-types";
import { Roles } from "../../enums/role.enum";
import { apiPath, authErrors, jsonResponse, ref } from "../helpers";

export const memberPaths: OpenAPIV3.PathsObject = {
  [apiPath("/member/workspace/{inviteCode}/join")]: {
    post: {
      tags: ["Member"],
      summary: "Join a workspace with an invite code",
      description:
        "Adds the authenticated caller to the workspace matching the invite code, " +
        "always with the `MEMBER` role. The caller need not already belong to the " +
        "workspace — the invite code is the authorization. Joining twice is rejected.",
      operationId: "joinWorkspace",
      parameters: [
        {
          name: "inviteCode",
          in: "path",
          required: true,
          description:
            "Invite code from the workspace's `inviteCode` field.",
          schema: { type: "string", example: "a1b2c3d4" },
        },
      ],
      responses: {
        "200": jsonResponse(
          "The caller joined the workspace.",
          {
            workspaceId: ref("ObjectId"),
            role: {
              type: "string",
              enum: Object.values(Roles),
              example: Roles.MEMBER,
            },
          },
          "Successfully joined the workspace",
        ),
        "400": {
          description: "The caller is already a member of this workspace.",
          content: { "application/json": { schema: ref("ErrorResponse") } },
        },
        "404": {
          description:
            "No workspace matches the invite code, or the seeded MEMBER role is missing.",
          content: { "application/json": { schema: ref("ErrorResponse") } },
        },
        ...authErrors,
      },
    },
  },
};
