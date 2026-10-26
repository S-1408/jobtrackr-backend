import app from "./app.js";
import { env } from "./config/env.js";
import {
  closeRefreshTokenStore,
  initializeRefreshTokenStore,
} from "./services/refresh-token.store.js";

await initializeRefreshTokenStore();

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`Server listening on port ${env.port}`);
});

let isShuttingDown = false;
const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received; shutting down`);

  const forceShutdown = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceShutdown.unref();

  server.close((serverError) => {
    if (serverError) {
      console.error("HTTP server shutdown failed", serverError);
      process.exitCode = 1;
    }
    void closeRefreshTokenStore()
      .catch((error: unknown) => {
        console.error("PostgreSQL pool shutdown failed", error);
        process.exitCode = 1;
      })
      .finally(() => clearTimeout(forceShutdown));
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);