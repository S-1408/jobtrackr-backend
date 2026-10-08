import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const isProduction = env.nodeEnv === "production"

// notFoundHandler catches the unmatched request:A missing route isn't initially an error object.

// Request
//    ↓
// Does a route match?
//    ↓
// NO
//    ↓
// notFoundHandler
//    ↓
// creates AppError(404)
//    ↓
// errorHandler
//    ↓
// sends JSON response

export const notFoundHandler:RequestHandler=(req,_res,next)=>{
      next(new AppError(404,`Route not found:${req.method} ${req.originalUrl}`))
}



// the error handler is designed to handle an error that already exists.
// errorHandler
//    ↓
// ┌───────────────────────────────┐
// │ Is it AppError?               │
// │       ↓                       │
// │ YES → use its status/message  │
// │                               │
// │ NO                            │
// │       ↓                       │
// │ Is invalid JSON?              │
// │       ↓                       │
// │ YES → 400                     │
// │                               │
// │ NO                            │
// │       ↓                       │
// │ 500 Internal Server Error     │
// └───────────────────────────────┘
//    ↓
// JSON response

export const errorHandler:ErrorRequestHandler=(err,_req,res,_next)=>{
    let statusCode = 500;
    let message ="Internal Server Error"
    // if this is a AppError 
    if(err instanceof AppError){
        // - Yes - use these status with messgae
        statusCode = err.statusCode
        message = err.message
    } else if(err?.type === "entity.parse.failed"){
        // No - invalid json
        // express.json() received a body that isn't valid JSON
       statusCode = 400
       message ="Request Body is not a valid JSON"
    }

    // if Not invalid json -
    // means something unexpected happens:like Database crashed  or don't recognize the error bcz We don't expose the actual database error to the client.
    if(statusCode>=500){
        console.error(err)
    }
    return res.status(statusCode).json({
        message,
        ...(!isProduction && statusCode>=500 && {stack:err?.stack}) // stack -You want the server logs to contain the actual error.in dev not prod
    })
}

