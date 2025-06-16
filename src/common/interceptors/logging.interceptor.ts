import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    this.logger.log(`Request: ${method} ${url}`);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - now;
        this.logger.log(
          `[Response] ${method} ${url} - ${res.status} - ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(
          `[Error] ${method} ${url} - ${duration}ms - ${error.message}`,
          error.stack,
        );
        throw error;
      }),
    );
  }
} 