import { AppError } from "../utils/customErrors.js";

export function limitAuthRequests(maxRequests, windowMs) {
  const attempts = new Map();
  const maxTrackedAddresses = 10_000;
  let resetAt = 0;

  return (req, res, next) => {
    const now = Date.now();
    if (now >= resetAt) {
      attempts.clear();
      resetAt = now + windowMs;
    }
    const key = req.ip;
    const count = attempts.get(key) ?? 0;
    if (count >= maxRequests || (!attempts.has(key) && attempts.size >= maxTrackedAddresses)) {
      res.set("Retry-After", String(Math.ceil((resetAt - now) / 1000)));
      return next(new AppError("Demasiados intentos. Volvé a intentar más tarde.", 429));
    }
    attempts.set(key, count + 1);
    return next();
  };
}
