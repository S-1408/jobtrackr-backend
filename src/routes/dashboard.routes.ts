import express from "express";
import { getApplicationStatistics } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get application statistics for the dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counts of applications by status and total applications
 *       401:
 *         description: Missing, invalid or expired access token
 */
router.get("/stats", getApplicationStatistics);

export default router;
