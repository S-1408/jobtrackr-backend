import type { QueryResultRow } from "pg";
import { pool } from "../db/database.js";

export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
}

export type PublicUser = Omit<User, "passwordHash">;

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

const mapUser = (row: UserRow): User => ({
  id: Number(row.id),
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
});

export async function findByEmail(email: string): Promise<User | undefined> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, name, password_hash
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function findById(id: number): Promise<User | undefined> {
  const result = await pool.query<UserRow>(
    `SELECT id, email, name, password_hash
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string,
): Promise<User> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, password_hash`,
    [email, name, passwordHash],
  );
  return mapUser(result.rows[0]);
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
