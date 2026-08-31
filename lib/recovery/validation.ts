import { z } from "zod";

export const recoveryRequestSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  method: z.enum(["email", "sms", "whatsapp"]),
});

export function normalizeIdentifier(identifier: string, method: "email" | "sms" | "whatsapp") {
  const value = identifier.trim();
  if (method === "email") return value.toLowerCase();
  return value.replace(/[\s()-]/g, "");
}

export function isValidRecoveryIdentifier(identifier: string, method: "email" | "sms" | "whatsapp") {
  if (method === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  }
  return /^\+[1-9]\d{7,14}$/.test(identifier);
}
