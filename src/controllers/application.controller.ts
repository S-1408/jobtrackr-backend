import type { Request, Response } from "express";
import * as applicationService from "../services/application.service.js";

// GET /applications?search=&status=
export const getAllApplication = (req: Request, res: Response) => {
  const { search, status } = req.query;
  // req.query values can be string | string[] | object — ignore anything that isn't a single string
  const applications = applicationService.list({
    search: typeof search === "string" ? search.trim() : undefined,
    status: typeof status === "string" ? status : undefined,
  });
  res.json(applications);
};

export const createApplication = (req: Request, res: Response) => {
  const { company, role, status } = req.body;
  const application = applicationService.create({ company, role, status });
  res.status(201).json(application);
};
export const updateApplication = (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;
  const { company, role, status } = req.body;
  const application = applicationService.update(id, { company, role, status });
  res.status(200).json(application);
};

export const deleteApplication = (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;
  applicationService.deleteById(id);
  res.status(204).send();
};

// HTTP request
//     ↓
// Controller
//     ↓
// Ask service for applications
//     ↓
