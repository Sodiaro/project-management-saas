import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1)
  .max(255);

export const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
});

export const exchangeAuthCodeSchema = z.object({
  code: z.string().trim().min(1, "Authorization code is required"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
