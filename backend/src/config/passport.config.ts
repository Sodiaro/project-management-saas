import passport, { session } from "passport";
import { Request } from "express";
import { Strategy as GoogleStrategy, Strategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as jwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { config } from "./app.config";
import { NotFoundException } from "../utils/appError";
import { ProviderEnum } from "../enums/account-provider.enum";
import {
  findUserByIdService,
  loginOrCreateAccountService,
  verifyUserService,
} from "../services/auth.service";
import AuthCodeModel, {
  AUTH_CODE_TTL_MS,
  generateAuthCode,
  hashAuthCode,
} from "../models/auth-code.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      passReqToCallback: true,
    },
    async (req: Request, accessToken, refreshToken, profile, done) => {
      try {
        const { email, sub: googleId, picture } = profile._json;
        if (!googleId) {
          throw new NotFoundException("Google ID (sub) is missing");
        }

        const { user } = await loginOrCreateAccountService({
          provider: ProviderEnum.GOOGLE,
          displayName: profile.displayName,
          providerId: googleId,
          picture: picture,
          email: email,
        });

        // Hand the redirect a single-use code rather than the access token, so
        // no long-lived credential ends up in the URL.
        const code = generateAuthCode();
        await AuthCodeModel.create({
          codeHash: hashAuthCode(code),
          userId: user._id,
          expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
        });
        req.authCode = code;

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    },
  ),
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    async (email, password, done) => {
      try {
        const user = await verifyUserService({ email, password });
        return done(null, user);
      } catch (error: any) {
        return done(error, false, { message: error?.message });
      }
    },
  ),
);

interface jwtPayload {
  userId: string;
  tokenVersion?: number;
}

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
  audience: ["user"],
  algorithms: ["HS256"],
};

passport.use(
  new jwtStrategy(options, async (payload: jwtPayload, done) => {
    try {
      const user = await findUserByIdService(payload.userId);
      if (!user) {
        return done(null, false);
      }

      if (payload.tokenVersion !== user.tokenVersion) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }),
);

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export const passportAuthenticateJWT = passport.authenticate("jwt", {
  session: false,
});
