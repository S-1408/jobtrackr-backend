import crypto from "node:crypto";
import { pool } from "../db/database.js";
import { verifyRefreshToken } from "./token.service.js";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function saveRefreshToken(token: string, userId: number) {
  const { exp } = verifyRefreshToken(token);
  await pool.query("DELETE FROM refresh_tokens WHERE expires_at <= NOW()");
  await pool.query(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), userId, new Date((exp ?? 0) * 1000)],
  );
}

export async function consumeRefreshToken(token: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM refresh_tokens
     WHERE token_hash = $1 AND expires_at > NOW()
     RETURNING token_hash`,
    [hashToken(token)],
  );
  return result.rowCount === 1;
}

export async function revokeRefreshToken(token: string) {
  await pool.query(
    "DELETE FROM refresh_tokens WHERE token_hash = $1",
    [hashToken(token)],
  );
}

export async function revokeAllForUser(userId: number) {
  await pool.query(
    "DELETE FROM refresh_tokens WHERE user_id = $1",
    [userId],
  );
}
