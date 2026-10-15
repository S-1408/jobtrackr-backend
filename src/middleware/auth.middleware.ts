import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../services/token.service.js";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "Missing access token"));
    return;
  }
  const token = authorization.slice("Bearer ".length);
  try {
    // throws AppError(401) if invalid/expired; guarantees sub is a string
    const payload = verifyAccessToken(token);
    req.user = { id: Number(payload.sub) };
    next();
  } catch (err) {
    next(err);
  }
}
