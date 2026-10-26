import type { QueryResultRow } from "pg";
import { AppError } from "../utils/AppError.js";
import { pool } from "../db/database.js";

export type ApplicationStatus = "applied" | "interview" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
}

interface ApplicationRow extends QueryResultRow {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_at: Date;
}

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

const isApplicationStatus = (value: unknown): value is ApplicationStatus =>
  typeof value === "string" &&
  (APPLICATION_STATUSES as string[]).includes(value);

const mapApplication = (row: ApplicationRow): Application => ({
  id: row.id,
  company: row.company,
  role: row.role,
  status: row.status,
  appliedAt: new Date(row.applied_at).toISOString(),
});

export async function list(
  userId: number,
  { search, status }: ListApplicationsQuery,
): Promise<Application[]> {
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

  const result = await pool.query<ApplicationRow>(
    `SELECT id, company, role, status, applied_at
     FROM applications
     WHERE user_id = $1
       AND ($2::text IS NULL OR status = $2)
       AND (
         $3::text IS NULL
         OR POSITION(LOWER($3) IN LOWER(company)) > 0
         OR POSITION(LOWER($3) IN LOWER(role)) > 0
       )
     ORDER BY applied_at DESC, id`,
    [userId, status ?? null, search?.trim() || null],
  );
  return result.rows.map(mapApplication);
}

export async function getStatistics(userId: number) {
  const result = await pool.query<{
    status: ApplicationStatus;
    count: number;
  }>(
    `SELECT status, COUNT(*)::int AS count
     FROM applications
     WHERE user_id = $1
     GROUP BY status`,
    [userId],
  );
  const byStatus = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  for (const row of result.rows) {
    byStatus[row.status] = row.count;
  }

  return {
    total: Object.values(byStatus).reduce((total, count) => total + count, 0),
    byStatus,
  };
}

interface ApplicationInput {
  company?: unknown;
  role?: unknown;
  status?: unknown;
}

export async function create(userId: number, payload: ApplicationInput) {
  const company = typeof payload.company === "string" ? payload.company.trim() : "";
  const role = typeof payload.role === "string" ? payload.role.trim() : "";
  const status = payload.status === undefined ? "applied" : payload.status;
  if (!company || !role) {
    throw new AppError(400, "Company and role are required");
  }
  if (!isApplicationStatus(status)) {
    throw new AppError(
      400,
      `status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
    );
  }

  const result = await pool.query<ApplicationRow>(
    `INSERT INTO applications (id, user_id, company, role, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company, role, status, applied_at`,
    [crypto.randomUUID(), userId, company, role, status],
  );
  return mapApplication(result.rows[0]);
}

export async function update(
  userId: number,
  id: string,
  payload: ApplicationInput,
): Promise<Application> {
  const updates: string[] = [];
  const values: unknown[] = [id, userId];

  if (payload.company !== undefined) {
    if (typeof payload.company !== "string" || !payload.company.trim()) {
      throw new AppError(400, "Company must be a non-empty string");
    }
    values.push(payload.company.trim());
    updates.push(`company = $${values.length}`);
  }
  if (payload.role !== undefined) {
    if (typeof payload.role !== "string" || !payload.role.trim()) {
      throw new AppError(400, "Role must be a non-empty string");
    }
    values.push(payload.role.trim());
    updates.push(`role = $${values.length}`);
  }
  if (payload.status !== undefined) {
    if (!isApplicationStatus(payload.status)) {
      throw new AppError(
        400,
        `status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
      );
    }
    values.push(payload.status);
    updates.push(`status = $${values.length}`);
  }

  const query =
    updates.length > 0
      ? `UPDATE applications
         SET ${updates.join(", ")}
         WHERE id = $1 AND user_id = $2
         RETURNING id, company, role, status, applied_at`
      : `SELECT id, company, role, status, applied_at
         FROM applications
         WHERE id = $1 AND user_id = $2`;
  const result = await pool.query<ApplicationRow>(query, values);
  if (!result.rows[0]) {
    throw new AppError(404, "Application does not exist");
  }
  return mapApplication(result.rows[0]);
}

export async function deleteById(userId: number, id: string) {
  const result = await pool.query(
    "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId],
  );
  if (result.rowCount !== 1) {
    throw new AppError(404, "Application does not exist");
  }
}
