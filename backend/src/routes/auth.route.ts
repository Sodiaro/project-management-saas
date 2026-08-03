import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  exchangeAuthCodeController,
  googleLoginCallback,
  loginController,
  logOutController,
  registerUserController,
} from "../controllers/auth.controller";
import { passportAuthenticateJWT } from "../config/passport.config";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginController);

// Revoking tokens requires knowing whose to revoke, so logout is authenticated.
authRoutes.post("/logout", passportAuthenticateJWT, logOutController);

// Completes Google sign-in: trades the single-use code from the OAuth redirect
// for an access token, keeping the token itself out of the URL.
authRoutes.post("/google/exchange", exchangeAuthCodeController);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
    session: false,
  }),
  googleLoginCallback
);

export default authRoutes;