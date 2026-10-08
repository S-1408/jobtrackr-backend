import { Response } from 'express';
import express from 'express';
import cors from 'cors';
import swaggerSpec from './swagger.js';
import swaggerUi from 'swagger-ui-express';
import applicationRoutes from './routes/application.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { env } from './config/env.js';

//Express app is just a request handler function. 
// Express runs your middleware and routes inside the one callback Node gives it.
const app = express();

// Middleware chain json,auth,logs
// cors middleware
app.use(cors({
    origin:env.corsOrigin
}));
//. JSON parser middleware
app.use(express.json());
// Middleware for HTTP caching. private-it tells browser and othr clients not to cache your api response and no-cache means revalidate cache before using store response
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

// Health check -Routes / route handlers
// add the route in to stach - 
// app.get=(path,fn)=>stack.push({method:"GET",path,fn})
app.get("/", (req, res) => {
  res.json({
    message: "JobTrackr API is running",
  });
});

// Routes
// app.use = (fn)=> stack.push({fn})
app.use("/api/applications", applicationRoutes);

// Error handling — must be registered LAST, after all routes
app.use(notFoundHandler);
app.use(errorHandler)

export default app;


// Client Request   - GET - /api/notes
//    ↓
//Node http server - Recieve raw request
//    ↓
// Express app - add helpers to req and res 
//    ↓
// Middleware chain - json ,cors,auth,logs if error(next(err))
//    ↓                                               ↓
// Routes- match methods + path                       ↓
//    ↓                                               ↓
// Route handler - logic and database call            ↓
//    ↓                                               ↓
// Response handler - response.status().json()        ↓
//                                                Error middleware - (err,req,res,next)                       

