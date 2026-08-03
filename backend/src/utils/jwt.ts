import jwt, { SignOptions } from "jsonwebtoken";
import { UserDocument } from "../models/user.model";
import { config } from "../config/app.config";

export type AccessTPayload = {
    userId: UserDocument["_id"];
    // Compared against the user's stored tokenVersion on every request so that
    // logging out invalidates tokens that were already handed out.
    tokenVersion: number;
};

type SignOptsAndSecret = SignOptions & {
    secret: string;
};

const defaults: SignOptions = {
    audience: ["user"],
};

export const accessTokenSignOptions: SignOptsAndSecret = {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    secret: config.JWT_SECRET,
};

export const signJwtToken = (
    payload: AccessTPayload,
    options?: SignOptsAndSecret
) => {
    const { secret, ...opts } = options || accessTokenSignOptions;
    return jwt.sign(payload, secret, {
        ...defaults,
        ...opts,
    });
};
