import { createHash } from "node:crypto";
import { env } from "../config/env.js";

export const sessionCookie = env.NODE_ENV === "production" ? "__Host-residencia" : "residencia";
export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
