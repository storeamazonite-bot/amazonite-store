import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string, secret: string): string {
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}
