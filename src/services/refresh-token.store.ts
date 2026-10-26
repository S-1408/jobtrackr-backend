import crypto from "node:crypto";
import { Pool } from "pg";
import { env } from "../config/env.js";
import { verifyRefreshToken } from "./token.service.js";

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

const getPool = () => {
  if (!env.databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  pool ??= new Pool({ connectionString: env.databaseUrl });
  return pool;
};

const initializeSchema = () => {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          token_hash CHAR(64) PRIMARY KEY,
          user_id BIGINT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        );
        CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
          ON refresh_tokens (user_id);
      `)
      .then(() => undefined)
      .catch((error: unknown) => {
        schemaReady = undefined;
        throw error;
      });
  }
  return schemaReady;
};

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function saveRefreshToken(token: string, userId: number) {
  const { exp } = verifyRefreshToken(token);
  await initializeSchema();
  await getPool().query("DELETE FROM refresh_tokens WHERE expires_at <= NOW()");
  await getPool().query(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), userId, new Date((exp ?? 0) * 1000)],
  );
}

export async function consumeRefreshToken(token: string): Promise<boolean> {
  await initializeSchema();
  const result = await getPool().query(
    `DELETE FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING token_hash`,
    [hashToken(token)],
  );
  return result.rowCount === 1;
}

export async function revokeRefreshToken(token: string) {
  await initializeSchema();
  await getPool().query(
    "DELETE FROM refresh_tokens WHERE token_hash = $1",
    [hashToken(token)],
  );
}

export async function revokeAllForUser(userId: number) {
  await initializeSchema();
  await getPool().query(
    "DELETE FROM refresh_tokens WHERE user_id = $1",
    [userId],
  );
}
