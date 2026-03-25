/**
 * Error Handling Middleware
 * Phase 5: REST API
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  // Handle known errors
  if (err.message.includes('not found')) {
    res.status(404).json({
      error: {
        message: err.message,
        code: 'NOT_FOUND',
      },
    });
    return;
  }

  if (err.message.includes('already exists')) {
    res.status(409).json({
      error: {
        message: err.message,
        code: 'CONFLICT',
      },
    });
    return;
  }

  // Generic 500 error
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}

/**
 * Async handler wrapper to catch errors automatically
 * Using any types to avoid strict Express type issues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
}
