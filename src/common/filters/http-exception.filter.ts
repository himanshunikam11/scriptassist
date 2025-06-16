import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[] = 'An unexpected error occurred';
    let error: string | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resp = exceptionResponse as Record<string, any>;
      message = resp.message ?? message;
      error = resp.error ?? null;
    }

    if (status >= 500) {
      this.logger.error(
        `Status ${status} Error: ${message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `Client error: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
      error,
    });
  }
} 