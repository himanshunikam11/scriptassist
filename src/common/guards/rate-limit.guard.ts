import { RATE_LIMIT_KEY, RateLimitOptions } from '@common/decorators/rate-limit.decorator';
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { Observable } from 'rxjs';

const requestRecords: Map<string, number[]> = new Map();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawIp = request.ip;
    const hashedIp = this.hashIp(rawIp);

    const handler = context.getHandler();
    const classRef = context.getClass();

    const rateLimitOptions =
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, handler) ||
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, classRef);

    if (!rateLimitOptions) return true;  
    return this.handleRateLimit(hashedIp, rateLimitOptions);
  }

  private handleRateLimit(ip: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const { limit, windowMs } = options;
    const windowStart = now - windowMs;

    const timestamps = requestRecords.get(ip) || [];

    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    requestRecords.set(ip, validTimestamps);
    
    if (validTimestamps.length >= limit) {
      throw new HttpException( {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
        }, HttpStatus.TOO_MANY_REQUESTS);
    }

    validTimestamps.push(now);
    requestRecords.set(ip, validTimestamps);

    return true;
  }

  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }
}