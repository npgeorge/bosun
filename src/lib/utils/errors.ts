// src/lib/utils/errors.ts

/**
 * Custom error classes for better error handling
 */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'You are not authorized to perform this action') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public violations: Array<{ type: string; message: string }>
  ) {
    super(message)
    this.name = 'CircuitBreakerError'
  }
}

/**
 * Type-safe error response
 */
export interface ErrorResponse {
  error: string
  message: string
  details?: unknown
  statusCode: number
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): ErrorResponse {
  if (error instanceof ValidationError) {
    return {
      error: 'Validation Error',
      message: error.message,
      details: error.field ? { field: error.field } : undefined,
      statusCode: 400,
    }
  }

  if (error instanceof AuthorizationError) {
    return {
      error: 'Authorization Error',
      message: error.message,
      statusCode: 403,
    }
  }

  if (error instanceof CircuitBreakerError) {
    return {
      error: 'Circuit Breaker Triggered',
      message: error.message,
      details: { violations: error.violations },
      statusCode: 400,
    }
  }

  if (error instanceof DatabaseError) {
    return {
      error: 'Database Error',
      message: 'A database error occurred',
      statusCode: 500,
    }
  }

  if (error instanceof Error) {
    return {
      error: error.name,
      message: error.message,
      statusCode: 500,
    }
  }

  return {
    error: 'Unknown Error',
    message: defaultMessage,
    statusCode: 500,
  }
}

/**
 * Log error safely with context
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error('Error occurred:', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  })
}
