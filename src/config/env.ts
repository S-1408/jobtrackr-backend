function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  // comma-separated list, e.g. "http://localhost:5173,http://localhost:4173"
  corsOrigin: required("CORS_ORIGIN")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
