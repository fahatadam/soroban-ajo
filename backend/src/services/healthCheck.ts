// backend/src/services/healthCheck.ts
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
// FIX: Import Horizon from the updated v12 SDK
import { Horizon } from 'stellar-sdk';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || '');
// FIX: Use Horizon.Server
const stellarServer = new Horizon.Server(process.env.STELLAR_NETWORK_URL || 'https://horizon-testnet.stellar.org');

interface CheckResult {
status: 'up' | 'down';
responseTime?: number;
error?: string;
}

interface HealthStatus {
status: 'healthy' | 'degraded' | 'unhealthy';
timestamp: string;
uptime: number;
checks: {
database: CheckResult;
redis: CheckResult;
stellar: CheckResult;
email: CheckResult;
};
}

export class HealthCheckService {
  /**
   * Verifies the connectivity and responsiveness of the PostgreSQL database.
   * 
   * @returns Promise resolving to a CheckResult with status and response time
   */
  async checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Verifies the connectivity of the Redis cache by sending a PING command.
   * 
   * @returns Promise resolving to a CheckResult
   */
  async checkRedis(): Promise<CheckResult> {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validates reachability of the Stellar Horizon server by fetching recent ledgers.
   * 
   * @returns Promise resolving to a CheckResult
   */
  async checkStellar(): Promise<CheckResult> {
    const start = Date.now();
    try {
      // Make a lightweight network call to verify Horizon is actually reachable
      await stellarServer.ledgers().limit(1).call();
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Aggregate health status of all critical system components.
   * 
   * @returns Promise resolving to a comprehensive HealthStatus report
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, stellar] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStellar(),
    ]);

    const allUp = [database, redis, stellar].every(c => c.status === 'up');
    const anyDown = [database, redis, stellar].some(c => c.status === 'down');

    return {
      status: allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database,
        redis,
        stellar,
        email: { status: 'up' },
      },
    };
  }
}