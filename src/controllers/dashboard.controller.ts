import type { Request, Response } from "express";
import * as applicationService from "../services/application.service.js";

export const getApplicationStatistics = (_req: Request, res: Response) => {
  res.json(applicationService.getStatistics());
};
