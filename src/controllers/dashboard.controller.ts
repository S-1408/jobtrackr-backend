import type { Request, Response } from "express";
import * as applicationService from "../services/application.service.js";
import { AppError } from "../utils/AppError.js";

export const getApplicationStatistics = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Missing access token");
  }
  res.json(await applicationService.getStatistics(req.user.id));
};
