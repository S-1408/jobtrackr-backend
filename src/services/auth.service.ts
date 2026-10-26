import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError.js";
import { findByEmail, findById, toPublicUser } from "./user.service.js";
import {
  consumeRefreshToken,
  revokeAllForUser,
  revokeRefreshToken,
  saveRefreshToken,
} from "./refresh-token.store.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service.js";

// Compared against when the email doesn't exist, so "unknown email" takes as long as "wrong password"
// and response time can't be used to discover which emails are registered.
const DUMMY_HASH = "$2b$10$XAuV0QFPaRQQBuTuGB04tOHZ71Ko6iSTpF.4QO7Bm.18SAga8pZP2";

// Sign both tokens and remember the refresh token so it can be revoked later
async function issueTokens(userId: number) {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await saveRefreshToken(refreshToken, userId);
  return { accessToken, refreshToken };
}

// login
//    ↓
// validate input (400)
//    ↓
// find user + compare password — same 401 message for both failures
//    ↓
// issue access + refresh tokens
export async function login(email: unknown, password: unknown) {
  // req.body is untyped — a number or object here would crash findByEmail with a 500
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const user = findByEmail(email.trim());
  // bcrypt.compare returns false for a wrong password — it does NOT throw
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError(401, "Invalid email or password");
  }

  return { ...(await issueTokens(user.id)), user: toPublicUser(user) };
}

// refresh
//    ↓
// verify signature + expiry (401)
//    ↓
// is it still in the store?
//    ↓
// NO → it was already rotated/revoked → token reuse → revoke ALL of this user's sessions (401)
//    ↓
// YES → rotate: revoke old, issue new pair
export async function refresh(oldRefreshToken: unknown) {
  if (typeof oldRefreshToken !== "string" || !oldRefreshToken) {
    throw new AppError(401, "Missing refresh token");
  }

  const payload = verifyRefreshToken(oldRefreshToken);
  const userId = Number(payload.sub); // sub is always a string in the JWT

  if (!(await consumeRefreshToken(oldRefreshToken))) {
    await revokeAllForUser(userId);
    throw new AppError(401, "Refresh token has been revoked");
  }

  // user may have been deleted since the token was issued
  if (!findById(userId)) {
    throw new AppError(401, "User no longer exists");
  }

  return issueTokens(userId);
}

// logout never fails — calling it twice, or with no/invalid cookie, still ends the session client-side
export async function logout(refreshToken: unknown) {
  if (typeof refreshToken === "string" && refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}
