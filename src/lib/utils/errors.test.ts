// src/lib/utils/errors.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
  CircuitBreakerError,
  createErrorResponse,
  logError,
} from './errors';

describe('ValidationError', () => {
  it('should create validation error with message', () => {
    const error = new ValidationError('Invalid email format');

    expect(error.message).toBe('Invalid email format');
    expect(error.name).toBe('ValidationError');
    expect(error instanceof Error).toBe(true);
  });

  it('should create validation error with field', () => {
    const error = new ValidationError('Invalid email format', 'email');

    expect(error.message).toBe('Invalid email format');
    expect(error.field).toBe('email');
    expect(error.name).toBe('ValidationError');
  });

  it('should create validation error without field', () => {
    const error = new ValidationError('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.field).toBeUndefined();
  });

  it('should have correct stack trace', () => {
    const error = new ValidationError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('AuthorizationError', () => {
  it('should create authorization error with default message', () => {
    const error = new AuthorizationError();

    expect(error.message).toBe('You are not authorized to perform this action');
    expect(error.name).toBe('AuthorizationError');
    expect(error instanceof Error).toBe(true);
  });

  it('should create authorization error with custom message', () => {
    const error = new AuthorizationError('Admin access required');

    expect(error.message).toBe('Admin access required');
    expect(error.name).toBe('AuthorizationError');
  });
});

describe('DatabaseError', () => {
  it('should create database error with message', () => {
    const error = new DatabaseError('Connection failed');

    expect(error.message).toBe('Connection failed');
    expect(error.name).toBe('DatabaseError');
    expect(error instanceof Error).toBe(true);
  });

  it('should create database error with original error', () => {
    const originalError = new Error('Network timeout');
    const error = new DatabaseError('Failed to fetch data', originalError);

    expect(error.message).toBe('Failed to fetch data');
    expect(error.originalError).toBe(originalError);
  });

  it('should create database error without original error', () => {
    const error = new DatabaseError('Query failed');

    expect(error.message).toBe('Query failed');
    expect(error.originalError).toBeUndefined();
  });
});

describe('CircuitBreakerError', () => {
  it('should create circuit breaker error with violations', () => {
    const violations = [
      { type: 'max_amount', message: 'Amount exceeds maximum' },
      { type: 'max_members', message: 'Too many members' },
    ];

    const error = new CircuitBreakerError('Circuit breaker triggered', violations);

    expect(error.message).toBe('Circuit breaker triggered');
    expect(error.violations).toEqual(violations);
    expect(error.name).toBe('CircuitBreakerError');
    expect(error instanceof Error).toBe(true);
  });

  it('should create circuit breaker error with empty violations', () => {
    const error = new CircuitBreakerError('Safety limit reached', []);

    expect(error.message).toBe('Safety limit reached');
    expect(error.violations).toEqual([]);
  });
});

describe('createErrorResponse', () => {
  describe('ValidationError responses', () => {
    it('should create response for ValidationError with field', () => {
      const error = new ValidationError('Invalid email format', 'email');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Validation Error',
        message: 'Invalid email format',
        details: { field: 'email' },
        statusCode: 400,
      });
    });

    it('should create response for ValidationError without field', () => {
      const error = new ValidationError('Invalid input');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Validation Error',
        message: 'Invalid input',
        details: undefined,
        statusCode: 400,
      });
    });
  });

  describe('AuthorizationError responses', () => {
    it('should create response for AuthorizationError', () => {
      const error = new AuthorizationError();
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Authorization Error',
        message: 'You are not authorized to perform this action',
        statusCode: 403,
      });
    });

    it('should create response for custom AuthorizationError', () => {
      const error = new AuthorizationError('Admin only');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Authorization Error',
        message: 'Admin only',
        statusCode: 403,
      });
    });
  });

  describe('CircuitBreakerError responses', () => {
    it('should create response for CircuitBreakerError', () => {
      const violations = [
        { type: 'max_amount', message: 'Amount too high' },
      ];
      const error = new CircuitBreakerError('Safety limits exceeded', violations);
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Circuit Breaker Triggered',
        message: 'Safety limits exceeded',
        details: { violations },
        statusCode: 400,
      });
    });
  });

  describe('DatabaseError responses', () => {
    it('should create response for DatabaseError', () => {
      const error = new DatabaseError('Query failed');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Database Error',
        message: 'A database error occurred',
        statusCode: 500,
      });
    });

    it('should not expose original database error details', () => {
      const originalError = new Error('Connection string leak');
      const error = new DatabaseError('Failed', originalError);
      const response = createErrorResponse(error);

      expect(response.message).not.toContain('leak');
      expect(response.message).toBe('A database error occurred');
    });
  });

  describe('generic Error responses', () => {
    it('should create response for generic Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);

      expect(response).toEqual({
        error: 'Error',
        message: 'Something went wrong',
        statusCode: 500,
      });
    });

    it('should use error name from Error instance', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const response = createErrorResponse(error);

      expect(response.error).toBe('CustomError');
      expect(response.message).toBe('Custom error message');
      expect(response.statusCode).toBe(500);
    });
  });

  describe('unknown error responses', () => {
    it('should handle string errors', () => {
      const response = createErrorResponse('Something went wrong');

      expect(response).toEqual({
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });

    it('should handle null errors', () => {
      const response = createErrorResponse(null);

      expect(response).toEqual({
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });

    it('should handle undefined errors', () => {
      const response = createErrorResponse(undefined);

      expect(response).toEqual({
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });

    it('should handle object errors', () => {
      const response = createErrorResponse({ code: 'UNKNOWN' });

      expect(response).toEqual({
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });

    it('should use custom default message', () => {
      const response = createErrorResponse('error', 'Custom default message');

      expect(response.message).toBe('Custom default message');
    });
  });

  describe('status code mapping', () => {
    it('should use 400 for validation errors', () => {
      const error = new ValidationError('Invalid');
      expect(createErrorResponse(error).statusCode).toBe(400);
    });

    it('should use 403 for authorization errors', () => {
      const error = new AuthorizationError();
      expect(createErrorResponse(error).statusCode).toBe(403);
    });

    it('should use 400 for circuit breaker errors', () => {
      const error = new CircuitBreakerError('Limit exceeded', []);
      expect(createErrorResponse(error).statusCode).toBe(400);
    });

    it('should use 500 for database errors', () => {
      const error = new DatabaseError('Failed');
      expect(createErrorResponse(error).statusCode).toBe(500);
    });

    it('should use 500 for generic errors', () => {
      const error = new Error('Generic');
      expect(createErrorResponse(error).statusCode).toBe(500);
    });

    it('should use 500 for unknown errors', () => {
      expect(createErrorResponse('unknown').statusCode).toBe(500);
    });
  });
});

describe('logError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should log Error instances with details', () => {
    const error = new Error('Test error');
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const loggedData = consoleErrorSpy.mock.calls[0][1];

    expect(loggedData.error).toEqual({
      name: 'Error',
      message: 'Test error',
      stack: expect.any(String),
    });
    expect(loggedData.timestamp).toBeDefined();
  });

  it('should log Error with context', () => {
    const error = new Error('Test error');
    const context = { userId: '123', action: 'create' };

    logError(error, context);

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const loggedData = consoleErrorSpy.mock.calls[0][1];

    expect(loggedData.context).toEqual(context);
  });

  it('should log custom error classes', () => {
    const error = new ValidationError('Invalid input', 'email');
    logError(error);

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const loggedData = consoleErrorSpy.mock.calls[0][1];

    expect(loggedData.error.name).toBe('ValidationError');
    expect(loggedData.error.message).toBe('Invalid input');
  });

  it('should log non-Error values', () => {
    logError('string error');

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const loggedData = consoleErrorSpy.mock.calls[0][1];

    expect(loggedData.error).toBe('string error');
  });

  it('should log null/undefined errors', () => {
    logError(null);
    logError(undefined);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });

  it('should include timestamp in ISO format', () => {
    const error = new Error('Test');
    logError(error);

    const loggedData = consoleErrorSpy.mock.calls[0][1];
    expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should log without context', () => {
    const error = new Error('Test');
    logError(error);

    const loggedData = consoleErrorSpy.mock.calls[0][1];
    expect(loggedData.context).toBeUndefined();
  });

  it('should log with complex context', () => {
    const error = new Error('Test');
    const context = {
      userId: '123',
      request: { method: 'POST', path: '/api/test' },
      metadata: { attempt: 3, retries: 2 },
    };

    logError(error, context);

    const loggedData = consoleErrorSpy.mock.calls[0][1];
    expect(loggedData.context).toEqual(context);
  });
});

describe('error handling integration', () => {
  it('should handle complete error workflow', () => {
    // Create error
    const error = new ValidationError('Invalid amount', 'amount');

    // Create response
    const response = createErrorResponse(error);
    expect(response.statusCode).toBe(400);
    expect(response.details).toEqual({ field: 'amount' });

    // Log error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError(error, { transaction: 'TX-001' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle chained errors', () => {
    const originalError = new Error('Network failure');
    const dbError = new DatabaseError('Failed to connect', originalError);

    const response = createErrorResponse(dbError);

    expect(response.error).toBe('Database Error');
    expect(response.statusCode).toBe(500);
    expect(response.message).toBe('A database error occurred');
  });

  it('should differentiate between error types', () => {
    const errors = [
      { error: new ValidationError('Invalid'), expectedStatus: 400 },
      { error: new AuthorizationError(), expectedStatus: 403 },
      { error: new DatabaseError('Failed'), expectedStatus: 500 },
      { error: new CircuitBreakerError('Limit', []), expectedStatus: 400 },
    ];

    errors.forEach(({ error, expectedStatus }) => {
      const response = createErrorResponse(error);
      expect(response.statusCode).toBe(expectedStatus);
    });
  });
});
