import express from 'express';
import cors from 'cors';
import swaggerSpec from './swagger.js';
import swaggerUi from 'swagger-ui-express';
import applicationRoutes from './routes/application.routes.js'
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API responses are per-user and change often: let the browser keep a copy,
// but it must revalidate with the server (ETag -> 304) before reusing it.
// `private` stops shared caches (CDNs/proxies) from storing user data.
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "private, no-cache");
  next();
});

// Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "JobTrackr API is running",
  });
});

// Routes
app.use("/api/applications", applicationRoutes);

export default app;