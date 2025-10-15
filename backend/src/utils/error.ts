export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, code, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(500, code, message);
  }
}

export function formatErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.issues,
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
}

export function formatSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}
