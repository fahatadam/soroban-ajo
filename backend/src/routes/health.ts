// backend/src/routes/health.ts
import { Router } from 'express';
import { HealthCheckService } from '../services/healthCheck';
import { register } from '../services/metricsService';

const router = Router();
const healthCheck = new HealthCheckService();

// Liveness probe (is the app running?)
router.get('/health/live', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness probe (is the app ready to serve traffic?)
router.get('/health/ready', async (req, res) => {
  const health = await healthCheck.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed health check
router.get('/health', async (req, res) => {
  const health = await healthCheck.getHealthStatus();
  res.json(health);
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;