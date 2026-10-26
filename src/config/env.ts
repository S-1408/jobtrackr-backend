import type { SignOptions } from "jsonwebtoken";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production");
}

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const corsOrigin = required("CORS_ORIGIN")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (corsOrigin.length === 0) {
  throw new Error("CORS_ORIGIN must contain at least one frontend origin");
}

for (const origin of corsOrigin) {
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error(`CORS_ORIGIN contains an invalid origin: ${origin}`);
  }
  if (
    parsedOrigin.origin !== origin ||
    !["http:", "https:"].includes(parsedOrigin.protocol)
  ) {
    throw new Error(`CORS_ORIGIN must contain only origin URLs: ${origin}`);
  }
  if (nodeEnv === "production" && parsedOrigin.protocol !== "https:") {
    throw new Error("Production CORS_ORIGIN values must use HTTPS");
  }
}

const jwtAccessSecret = required("JWT_ACCESS_SECRET");
const refreshTokenSecret = required("JWT_REFRESH_SECRET");
if (nodeEnv === "production") {
  if (jwtAccessSecret.length < 32 || refreshTokenSecret.length < 32) {
    throw new Error("Production JWT secrets must each be at least 32 characters");
  }
  if (jwtAccessSecret === refreshTokenSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }
}

// jsonwebtoken only accepts a number (seconds) or a duration string like "15m" / "7d"
type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export const env = {
  nodeEnv,
  port,
  corsOrigin,
  jwtAccessSecret,
  jwtAccessExpiresIn: required("JWT_ACCESS_EXPIRES_IN") as ExpiresIn,
  refreshTokenSecret,
  refreshTokenExpiresIn: required("JWT_REFRESH_EXPIRES_IN") as ExpiresIn,
  databaseUrl: required("DATABASE_URL"),
};
