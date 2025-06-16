import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Options for configuring rate limiting.
 *
 * @property limit - The maximum number of requests allowed within the window.
 * @property windowMs - The duration of the rate limiting window in milliseconds.
 */
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

/**
 * Sets rate limit metadata for a route.
 * To be used with a rate limit guard.
 *
 * @param options Rate limit options
 */
export const RateLimit = (options: RateLimitOptions) => {
  return SetMetadata(RATE_LIMIT_KEY, options);
}; 