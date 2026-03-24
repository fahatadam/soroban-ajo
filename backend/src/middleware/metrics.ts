// backend/src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, activeConnections } from '../services/metricsService';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
// Increment active connections when a request starts
activeConnections.inc();

  // Start the timer for request duration
  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    // Decrement active connections when response is sent
    activeConnections.dec();

    const route = req.route ? req.route.path : req.path;

    // Record total requests
    httpRequestTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });

    // Record request duration
    endTimer({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });
  });

  next();
};