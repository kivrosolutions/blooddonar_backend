import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class ApiResponseHandler {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponseHandler.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(res: Response, message = 'Error', statusCode = 500): Response {
    const response: ApiResponse<null> = {
      success: false,
      message,
      error: message,
    };
    return res.status(statusCode).json(response);
  }
}
