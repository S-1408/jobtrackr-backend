import type { SignOptions } from "jsonwebtoken";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// jsonwebtoken only accepts a number (seconds) or a duration string like "15m" / "7d"
type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // comma-separated list, e.g. "http://localhost:5173,http://localhost:4173"
  corsOrigin: required("CORS_ORIGIN")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: required("JWT_ACCESS_EXPIRES_IN") as ExpiresIn,
  refreshTokenSecret: required("JWT_REFRESH_SECRET"),
  refreshTokenExpiresIn: required("JWT_REFRESH_EXPIRES_IN") as ExpiresIn,
  databaseUrl: process.env.DATABASE_URL,
};
