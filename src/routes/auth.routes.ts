import express from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
const router = express.Router();

// Swagger UI is served from the same origin as the API, so the browser stores the httpOnly
// refreshToken cookie from /login and sends it to /refresh and /logout automatically.

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create an account and start a session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Account created; access token and refresh cookie issued
 *       400:
 *         description: Invalid registration data
 *       409:
 *         description: Email is already registered
 */
router.post("/register", register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in — returns an access token and sets the refreshToken cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: abc@gmail.com
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in. Copy accessToken into the Authorize button.
 *       400:
 *         description: Email or password missing
 *       401:
 *         description: Invalid email or password
 */
// Public: credentials are used to issue tokens; no access token is required.
router.post("/login",login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using the refreshToken cookie (rotates the cookie)
 *     responses:
 *       200:
 *         description: New access token; refreshToken cookie replaced
 *       401:
 *         description: Missing, invalid, expired or revoked refresh token
 */
// Public to access-token auth: the refresh-token cookie is used instead.
router.post("/refresh",refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the refresh token and clear the cookie
 *     responses:
 *       204:
 *         description: Logged out (also returned when there was no session)
 */
// Public to access-token auth: logout revokes a refresh token when its cookie is present.
router.post("/logout",logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user (requires access token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The logged-in user
 *       401:
 *         description: Missing, invalid or expired access token
 */

// Protected: requires a valid access token.
router.get("/me",requireAuth,me);

export default router;
