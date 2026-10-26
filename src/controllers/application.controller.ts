import type { Request, Response } from "express";
import * as applicationService from "../services/application.service.js";
import { AppError } from "../utils/AppError.js";

function currentUserId(req: Request): number {
  if (!req.user) {
    throw new AppError(401, "Missing access token");
  }
  return req.user.id;
}

// GET /applications?search=&status=
export const getAllApplication = async (req: Request, res: Response) => {
  const { search, status } = req.query;
  const applications = await applicationService.list(currentUserId(req), {
    search: typeof search === "string" ? search.trim() : undefined,
    status: typeof status === "string" ? status : undefined,
  });
  res.json(applications);
};

export const createApplication = async (req: Request, res: Response) => {
  const application = await applicationService.create(
    currentUserId(req),
    req.body ?? {},
  );
  res.status(201).json(application);
};

export const updateApplication = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const application = await applicationService.update(
    currentUserId(req),
    req.params.id,
    req.body ?? {},
  );
  res.status(200).json(application);
};

export const deleteApplication = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  await applicationService.deleteById(currentUserId(req), req.params.id);
  res.status(204).send();
};
