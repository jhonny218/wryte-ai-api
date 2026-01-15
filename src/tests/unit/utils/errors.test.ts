import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../../utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong', {
        field: 'test',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Something went wrong');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError without details', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.message).toBe('Something went wrong');
      expect(error.details).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new AppError(500, 'TEST_ERROR', 'Test');
      }).toThrow(AppError);

      try {
        throw new AppError(500, 'TEST_ERROR', 'Test message');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('Test message');
      }
    });
  });

  describe('BadRequestError', () => {
    it('should create a BadRequestError with correct properties', () => {
      const error = new BadRequestError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('BadRequestError');
    });

    it('should create a BadRequestError with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new BadRequestError('Validation failed', details);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
    });

    it('should create a BadRequestError without details', () => {
      const error = new BadRequestError('Invalid request');

      expect(error.details).toBeUndefined();
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create an UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with default message', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Forbidden');
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create a ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Access denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create a NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with correct properties', () => {
      const error = new ConflictError('Resource already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Resource already exists');
      expect(error.name).toBe('ConflictError');
    });

    it('should create a ConflictError with custom message', () => {
      const error = new ConflictError('Email already in use');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Email already in use');
    });
  });

  describe('Error inheritance', () => {
    it('should correctly identify error types using instanceof', () => {
      const badRequest = new BadRequestError('Bad request');
      const unauthorized = new UnauthorizedError();
      const forbidden = new ForbiddenError();
      const notFound = new NotFoundError();
      const conflict = new ConflictError('Conflict');

      expect(badRequest instanceof AppError).toBe(true);
      expect(badRequest instanceof BadRequestError).toBe(true);
      expect(badRequest instanceof UnauthorizedError).toBe(false);

      expect(unauthorized instanceof AppError).toBe(true);
      expect(unauthorized instanceof UnauthorizedError).toBe(true);
      expect(unauthorized instanceof ForbiddenError).toBe(false);

      expect(forbidden instanceof AppError).toBe(true);
      expect(forbidden instanceof ForbiddenError).toBe(true);
      expect(forbidden instanceof NotFoundError).toBe(false);

      expect(notFound instanceof AppError).toBe(true);
      expect(notFound instanceof NotFoundError).toBe(true);
      expect(notFound instanceof ConflictError).toBe(false);

      expect(conflict instanceof AppError).toBe(true);
      expect(conflict instanceof ConflictError).toBe(true);
      expect(conflict instanceof BadRequestError).toBe(false);
    });

    it('should all be instances of Error', () => {
      const errors = [
        new AppError(500, 'TEST', 'Test'),
        new BadRequestError('Bad'),
        new UnauthorizedError(),
        new ForbiddenError(),
        new NotFoundError(),
        new ConflictError('Conflict'),
      ];

      errors.forEach((error) => {
        expect(error instanceof Error).toBe(true);
      });
    });
  });
});
