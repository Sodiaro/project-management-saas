import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { config } from "../config/app.config";
import {
  exchangeAuthCodeSchema,
  registerSchema,
} from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  findUserByIdService,
  registerUserService,
} from "../services/auth.service";
import AuthCodeModel, { hashAuthCode } from "../models/auth-code.model";
import UserModel from "../models/user.model";
import { UnauthorizedException } from "../utils/appError";
import passport from "passport";
import { signJwtToken } from "../utils/jwt";

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const authCode = req.authCode;

    const redirectUrl = new URL(config.FRONTEND_GOOGLE_CALLBACK_URL);

    if (!authCode) {
      redirectUrl.searchParams.set("status", "failure");
      return res.redirect(redirectUrl.toString());
    }

    redirectUrl.searchParams.set("status", "success");
    redirectUrl.searchParams.set("code", authCode);

    return res.redirect(redirectUrl.toString());
  },
);

export const exchangeAuthCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = exchangeAuthCodeSchema.parse(req.body);

    // Deleting as we read makes the code single-use even if two requests race.
    const authCode = await AuthCodeModel.findOneAndDelete({
      codeHash: hashAuthCode(code),
    });

    if (!authCode || authCode.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Invalid or expired authorization code");
    }

    const user = await findUserByIdService(authCode.userId.toString());

    if (!user) {
      throw new UnauthorizedException("Invalid or expired authorization code");
    }

    const access_token = signJwtToken({
      userId: user._id,
      tokenVersion: user.tokenVersion,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Logged in successfully",
      access_token,
      user,
      current_workspace: user.currentWorkspace ?? null,
    });
  },
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({
      ...req.body,
    });

    await registerUserService(body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
    });
  },
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined,
      ) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: info?.message || "Invalid email or password",
          });
        }

        // req.logIn(user, (err) => {
        //   if (err) {
        //     return next(err);
        //   }

        //   return res.status(HTTPSTATUS.OK).json({
        //     message: "Logged in successfully",
        //     user,
        //   });
        // });

        const access_token = signJwtToken({
          userId: user._id,
          tokenVersion: user.tokenVersion,
        });

        return res.status(HTTPSTATUS.OK).json({
          message: "Logged in successfully",
          access_token,
          user,
        });
      },
    )(req, res, next);
  },
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    await UserModel.updateOne(
      { _id: req.user?._id },
      { $inc: { tokenVersion: 1 } },
    );

    return res
      .status(HTTPSTATUS.OK)
      .json({ message: "Logged out successfully" });
  },
);
