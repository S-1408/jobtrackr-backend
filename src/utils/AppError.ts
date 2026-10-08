// An error we throw on purpose, with the HTTP status the client should get.

// 400 → Validation error
// 401 → Not authenticated
// 403 → Not authorized
// 404 → Resource not found
// 409 → Conflict

// Anything that is NOT an AppError is treated as an unexpected bug (500).
// Usage: throw new AppError(404, "Application not found");

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
