import crypto from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js';

// Verified payload with `sub` guaranteed. Note: sub is a string — use Number(payload.sub) for user lookups
export type TokenPayload = JwtPayload & { sub: string };

export function signAccessToken(userId:number):string{
    return jwt.sign(
        {sub:String(userId)},// identify the user
        env.jwtAccessSecret, // sign the token so it can be verified later
        {expiresIn:env.jwtAccessExpiresIn} // control how long the token remains valid
    )
}

export function signRefreshToken(userId:number):string{
    return jwt.sign(
        {sub:String(userId),jti:crypto.randomUUID()},// jti - JWT ID its uniqly identifies an individualToken
        env.refreshTokenSecret,
        {expiresIn:env.refreshTokenExpiresIn}
    )
}

// Shared by both verify functions — only the secret and the error label differ
function verify(token:string,secret:string,label:string):TokenPayload{
  let decoded:string | JwtPayload;
  try{
    // pin the algorithm so a token signed with anything else is rejected
    decoded = jwt.verify(token,secret,{algorithms:["HS256"]})
  }catch{
    // expired / bad signature / malformed → 401, not a 500
    throw new AppError(401,`Invalid or expired ${label} token`)
  }
  if(typeof decoded === "string" || typeof decoded.sub !== "string"){
    throw new AppError(401,`Invalid ${label} token`)
  }
  return decoded as TokenPayload
}

export function verifyAccessToken(token:string):TokenPayload{
  return verify(token,env.jwtAccessSecret,"access")
}

export function verifyRefreshToken(token:string):TokenPayload{
  return verify(token,env.refreshTokenSecret,"refresh")
}

// ---------------- Refresh token store ----------------
// Server-side list of refresh tokens that are still allowed. Logout / rotation removes entries,
// which is the only way to "kill" a JWT before it expires.
// Keyed by sha256 of the token, so a leaked store can't be used to log in.
// In-memory: resets on server restart (everyone gets logged out) — move to a DB table later.

// You need an in-memory refresh token store to track which refresh tokens are valid.
//  Instead of storing the actual token, store its SHA-256 hash as the key. 
// This makes it safer than keeping raw refresh tokens in memory.

interface StoredRefreshToken {
  userId:number;
  expiresAt:number; // ms timestamp, taken from the token's exp claim
}

// Important: This Map is for development and testing.
//  It loses all tokens when the Node.js process restarts and isn't shared across multiple server instances.
//  For production, use a persistent store such as Redis or a database, with appropriate expiration and revocation handling.
const refreshTokens = new Map<string,StoredRefreshToken>()
// Hash the token before storing or looking it up 

const hashToken = (token:string) =>
  crypto.createHash("sha256").update(token).digest("hex")


// {
//   userId: "1",
//   expiresAt: 1792654800000
// }
export function saveRefreshToken(token:string,userId:number){
  const { exp } = verifyRefreshToken(token)
  refreshTokens.set(hashToken(token),{
    userId,
    expiresAt:(exp ?? 0) * 1000,
  })
}

export function isRefreshTokenValid(token:string):boolean{
  const key = hashToken(token)
  const stored = refreshTokens.get(key)
  if(!stored) return false
  if(stored.expiresAt <= Date.now()){
    refreshTokens.delete(key) // clean up expired entries as we find them
    return false
  }
  return true
}

export function revokeRefreshToken(token:string){
  refreshTokens.delete(hashToken(token))
}

// Used when a rotated (already revoked) token is replayed — assume theft, log the user out everywhere
export function revokeAllForUser(userId:number){
  for(const [key,stored] of refreshTokens){
    if(stored.userId === userId){
      refreshTokens.delete(key)
    }
  }
}
