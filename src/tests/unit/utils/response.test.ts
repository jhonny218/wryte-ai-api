import { Response } from 'express';
import {
  successResponse,
  createdResponse,
  errorResponse,
  ApiResponse,
} from '../../../utils/response';
import { AppError, BadRequestError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

jest.mock('../../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Response Utilities', () => {
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn();
    mockStatus = jest.fn(() => ({ json: mockJson }));
    mockRes = {
      status: mockStatus as any,
      json: mockJson,
    };
  });

  describe('successResponse', () => {
    it('should return a success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const message = 'Success';

      successResponse(mockRes as Response, data, message);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 200,
        data,
        message,
      });
    });

    it('should return a success response without message', () => {
      const data = { id: '123' };

      successResponse(mockRes as Response, data);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 200,
        data,
        message: undefined,
      });
    });

    it('should return a success response with custom status', () => {
      const data = { count: 10 };
      const message = 'Custom success';
      const customStatus = 206;

      successResponse(mockRes as Response, data, message, customStatus);

      expect(mockStatus).toHaveBeenCalledWith(206);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 206,
        data,
        message,
      });
    });

    it('should handle null data', () => {
      successResponse(mockRes as Response, null);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 200,
        data: null,
        message: undefined,
      });
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];

      successResponse(mockRes as Response, data);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 200,
        data,
        message: undefined,
      });
    });

    it('should handle primitive data types', () => {
      successResponse(mockRes as Response, 'string data');

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'string data',
        })
      );

      jest.clearAllMocks();
      successResponse(mockRes as Response, 42);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 42,
        })
      );

      jest.clearAllMocks();
      successResponse(mockRes as Response, true);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: true,
        })
      );
    });
  });

  describe('createdResponse', () => {
    it('should return a 201 Created response', () => {
      const data = { id: '123', name: 'New Resource' };
      const message = 'Resource created';

      createdResponse(mockRes as Response, data, message);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 201,
        data,
        message,
      });
    });

    it('should return a 201 Created response without message', () => {
      const data = { id: '456' };

      createdResponse(mockRes as Response, data);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 201,
        data,
        message: undefined,
      });
    });
  });

  describe('errorResponse', () => {
    it('should handle BadRequestError', () => {
      const error = new BadRequestError('Invalid input', { field: 'email' });

      errorResponse(mockRes as Response, error);

      expect(logger.warn).toHaveBeenCalledWith('AppError: BAD_REQUEST - Invalid input');
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 400,
        message: 'Invalid input',
        code: 'BAD_REQUEST',
        details: { field: 'email' },
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User not found');

      errorResponse(mockRes as Response, error);

      expect(logger.warn).toHaveBeenCalledWith('AppError: NOT_FOUND - User not found');
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 404,
        message: 'User not found',
        code: 'NOT_FOUND',
        details: undefined,
      });
    });

    it('should handle AppError with custom status', () => {
      const error = new AppError(418, 'TEAPOT', "I'm a teapot");

      errorResponse(mockRes as Response, error);

      expect(logger.warn).toHaveBeenCalledWith("AppError: TEAPOT - I'm a teapot");
      expect(mockStatus).toHaveBeenCalledWith(418);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 418,
        message: "I'm a teapot",
        code: 'TEAPOT',
        details: undefined,
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      errorResponse(mockRes as Response, error);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error in response helper', {
        error: 'Error: Unknown error',
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Internal server error',
      });
    });

    it('should handle string errors', () => {
      const error = 'String error message';

      errorResponse(mockRes as Response, error);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error in response helper', {
        error: 'String error message',
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Internal server error',
      });
    });

    it('should handle null/undefined errors', () => {
      errorResponse(mockRes as Response, null);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error in response helper', {
        error: 'null',
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Internal server error',
      });

      jest.clearAllMocks();

      errorResponse(mockRes as Response, undefined);

      expect(logger.error).toHaveBeenCalledWith('Unhandled error in response helper', {
        error: 'undefined',
      });
    });

    it('should handle AppError without details', () => {
      const error = new AppError(500, 'INTERNAL_ERROR', 'Server error');

      errorResponse(mockRes as Response, error);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Server error',
        code: 'INTERNAL_ERROR',
        details: undefined,
      });
    });

    it('should log warnings for AppErrors', () => {
      const errors = [
        new BadRequestError('Bad request'),
        new NotFoundError('Not found'),
        new AppError(500, 'TEST', 'Test error'),
      ];

      errors.forEach((error, index) => {
        jest.clearAllMocks();
        errorResponse(mockRes as Response, error);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    it('should log errors for non-AppErrors', () => {
      const errors = [new Error('Standard error'), 'String error', { error: 'object' }];

      errors.forEach((error) => {
        jest.clearAllMocks();
        errorResponse(mockRes as Response, error);
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('ApiResponse type', () => {
    it('should match the expected structure for success', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        status: 200,
        data: { id: '123' },
        message: 'Success',
      };

      expect(response.success).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ id: '123' });
      expect(response.message).toBe('Success');
    });

    it('should match the expected structure for error', () => {
      const response: ApiResponse = {
        success: false,
        status: 400,
        message: 'Error message',
        errors: { field: 'validation error' },
      };

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toBe('Error message');
      expect(response.errors).toEqual({ field: 'validation error' });
    });

    it('should allow optional fields', () => {
      const minimal: ApiResponse = {
        success: true,
        status: 200,
      };

      expect(minimal.data).toBeUndefined();
      expect(minimal.message).toBeUndefined();
      expect(minimal.errors).toBeUndefined();
    });
  });
});
