import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Generates a URL-safe random token, e.g. for email verification / reset links. */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Hashes a token before persisting it (so raw tokens never sit in the DB). */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
