import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1)
  .max(255);

// Length is the property that actually resists guessing, so this trades the
// old 4-character floor for a longer minimum rather than composition rules.
// The ceiling matters too: bcrypt silently ignores anything past 72 bytes, so
// a longer password would be accepted while only its first 72 bytes are checked.
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

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});