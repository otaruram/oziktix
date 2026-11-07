import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../domain/errors';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error('[Unhandled Internal Error]:', err);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

