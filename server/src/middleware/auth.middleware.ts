import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const JWT_SECRET = env.JWT_SECRET;

const parseCookie = (headerValue: string | undefined, key: string) => {
  if (!headerValue) {
    return null;
  }

  const match = headerValue
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(key.length + 1));
};

const TOKEN_COOKIE_NAME = "interviewcraft_token";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  const cookieToken = parseCookie(req.headers.cookie, TOKEN_COOKIE_NAME);
  const token = bearerToken || cookieToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    // attach trusted user identity to request
    (req as any).user = { id: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
