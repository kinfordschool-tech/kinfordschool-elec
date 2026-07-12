const ipCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if the request exceeds the rate limit.
 * @param ip The client's IP address.
 * @param limit Max allowed attempts in the time window.
 * @param windowMs Time window in milliseconds.
 * @returns true if allowed, false if rate-limited.
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cached = ipCache.get(ip);

  // If no entry or window expired, reset rate limit
  if (!cached || now > cached.resetAt) {
    ipCache.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // If count is at or exceeds limit, block
  if (cached.count >= limit) {
    return false;
  }

  // Increment count
  cached.count += 1;
  return true;
}

/**
 * Get client IP from NextRequest headers.
 */
export function getClientIp(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  return '127.0.0.1';
}
