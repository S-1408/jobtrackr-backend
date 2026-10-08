import express from "express";
import {
  createApplication,
  deleteApplication,
  getAllApplication,
  updateApplication,
} from "../controllers/application.controller.js";

const router = express.Router();

router.get("/", getAllApplication);
router.post("/", createApplication);
//  Partial update the request application by id
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);
export default router;
