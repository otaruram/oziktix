export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Seat is already locked by another user.') {
    super(message, 409, 'CONFLICT');
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Purchase limit reached: Maximum 2 seats per verified Google account.') {
    super(message, 429, 'QUOTA_EXCEEDED');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized: Missing or invalid Supabase Bearer token.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Invalid request payload.') {
    super(message, 400, 'BAD_REQUEST');
  }
}

