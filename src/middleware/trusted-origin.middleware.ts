import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get("origin");
  if (origin && !env.corsOrigin.includes(origin)) {
    next(new AppError(403, "Untrusted request origin"));
    return;
  }
  next();
};
