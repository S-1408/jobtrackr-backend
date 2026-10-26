import express from "express";
import {
  createApplication,
  deleteApplication,
  getAllApplication,
  updateApplication,
} from "../controllers/application.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// All application routes are protected and require a valid access token.
router.use(requireAuth);

router.get("/", getAllApplication);
router.post("/", createApplication);
//  Partial update the request application by id
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);
export default router;
