import "server-only";

import { compare, hash } from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;
const DUMMY_PASSWORD_HASH =
  "$2b$12$SvPkeVB1aPZJPkRDGPWkBeSs.n8CS.mBelWNZMITON.G4I8AddjA.";

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.")
  .regex(/[^A-Za-z0-9]/, "Include a symbol.");

export async function hashPassword(password: string) {
  return hash(passwordSchema.parse(password), BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash?: string | null) {
  return compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
}
