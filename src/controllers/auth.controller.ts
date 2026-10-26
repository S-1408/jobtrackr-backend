import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { findById, toPublicUser } from "../services/user.service.js";
import { AppError } from "../utils/AppError.js";

const REFRESH_COOKIE = "refreshToken";

const refreshCookieOptions: CookieOptions = {
    httpOnly:true,                       // Js cant read it -XSS cant steal it
    secure:env.nodeEnv==="production",   // HTTPS only in prod
    sameSite:"strict",                   // CSRF protection
    path:"/api/auth",                    // only sent to auth routes, not every request
    maxAge:7*24*60*60*1000               // match the refresh expiry
}

// clearCookie must match path/httpOnly/sameSite/secure of the original cookie, but not maxAge
const { maxAge: _maxAge, ...clearCookieOptions } = refreshCookieOptions;

// POST /api/auth/login  body: { email, password }
// Refresh token goes in the httpOnly cookie only — never in the JSON body
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  const { accessToken, refreshToken, user } = await authService.login(email, password);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.json({ accessToken, user });
};

// POST /api/auth/refresh  (cookie sent automatically by the browser)
export const refresh = async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  res.json({ accessToken });
};

// POST /api/auth/logout — always 204, even without a cookie
export const logout = async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions);
  res.status(204).send();
};

// GET /api/auth/me  (behind requireAuth, so req.user is set)
export const me = (req: Request, res: Response) => {
  const user = req.user && findById(req.user.id);
  if (!user) {
    throw new AppError(401, "User no longer exists");
  }
  res.json({ user: toPublicUser(user) });
};
