import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "JobTrackr API",
      version: "1.0.0",
      description: "API for managing job applications",
    },

    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development",
      },
      {
        url: "https://jobtrackr-backend-4ji9.onrender.com",
        description: "Production",
      },
    ],

    // Adds the "Authorize" button — paste the accessToken from /login (without "Bearer ")
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./src/routes/*.routes.ts"]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;