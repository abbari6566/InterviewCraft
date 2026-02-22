import { Request, Response, NextFunction } from "express";

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export const createRateLimit = (options: { windowMs: number; max: number }) => {
  const { windowMs, max } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil(
        (current.windowStart + windowMs - now) / 1000,
      );
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({ error: "Too many requests" });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
