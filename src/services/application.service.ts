import { AppError } from "../utils/AppError.js";
type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";
interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
}
interface CreateApplicationInput {
  company: string;
  role: string;
  status: ApplicationStatus
}
interface UpdateApplicationInput {
  company?: string;
  role?: string;
  status?:ApplicationStatus
}
export const applications:Application[] = [
  {
    id: "1",
    company: "Google",
    role: "Frontend Developer",
    status: "applied",
    appliedAt: "2026-09-30T10:30:00.000Z",
  },
  {
    id: "2",
    company: "Microsoft",
    role: "React Developer",
    status: "interview",
    appliedAt: "2026-09-30T10:30:00.000Z",
  },
];

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];
const MAX_SEARCH_LENGTH = 100;

interface ListApplicationsQuery {
  search?: string;
  status?: string;
}

const isApplicationStatus = (value: string): value is ApplicationStatus =>
  (APPLICATION_STATUSES as string[]).includes(value);

// Contract order: filter by status → search on company/role
export function list({ search, status }: ListApplicationsQuery) {
  if (status !== undefined && !isApplicationStatus(status)) {
    throw new AppError(
      400,
      `status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
    );
  }
  if (search !== undefined && search.length > MAX_SEARCH_LENGTH) {
    throw new AppError(
      400,
      `search must be at most ${MAX_SEARCH_LENGTH} characters`,
    );
  }

  // Blank search ("" after trim) means no search
  const term = search?.toLowerCase();
  return applications.filter(
    (a) =>
      (!status || a.status === status) &&
      (!term ||
        a.company.toLowerCase().includes(term) ||
        a.role.toLowerCase().includes(term)),
  );
}

export const create = (payload: CreateApplicationInput) => {
  const { company, role, status } = payload;
  if (!company || !role) {
    throw new AppError(400, "Company and role are required");
  }
  const application = {
    id: crypto.randomUUID(),
    company,
    role,
    status: status || "applied",
    appliedAt: new Date().toISOString(),
  };
  applications.push(application);
  return application;
};

export const update = (id: string, payload: UpdateApplicationInput) => {
  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new AppError(404, "Application does not exist");
  }

  applications[index] = {
    ...applications[index],
    company: payload.company ?? applications[index].company,
    role: payload.role ?? applications[index].role,
    status: payload.status ?? applications[index].status,
  };

  return applications[index];
};

export const deleteById = (id: string) => {
  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new AppError(404, "Application does not exist");
  }
  // splice mutates the shared array; filter() would return a copy and leave it unchanged
  const [deleted] = applications.splice(index, 1);
  return deleted;
};
