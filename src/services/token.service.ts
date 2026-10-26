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
