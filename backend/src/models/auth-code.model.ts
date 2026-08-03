import crypto from "crypto";
import mongoose, { Document, Schema } from "mongoose";

export interface AuthCodeDocument extends Document {
  codeHash: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export const AUTH_CODE_TTL_MS = 60 * 1000;

const authCodeSchema = new Schema<AuthCodeDocument>(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Mongo drops the document once expiresAt passes, so spent codes do not pile up
// even when a redirect is abandoned and never exchanged.
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const hashAuthCode = (code: string) =>
  crypto.createHash("sha256").update(code).digest("hex");

export const generateAuthCode = () => crypto.randomBytes(32).toString("hex");

const AuthCodeModel = mongoose.model<AuthCodeDocument>(
  "AuthCode",
  authCodeSchema,
);

export default AuthCodeModel;
