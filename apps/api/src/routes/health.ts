import { FastifyInstance } from 'fastify';
import { HealthResponse } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { globalSourceRegistry } from '../sources/types.js';

export function registerHealthRoutes(app: FastifyInstance, cache: Cache): void {
  const handler = async (): Promise<HealthResponse> => {
    const memory = process.memoryUsage();
    const sourceHealth = globalSourceRegistry.getHealthSummary();
    
    // Check if any sources are in error state to set global status
    const sourceStatuses = Object.values(sourceHealth);
    const hasError = sourceStatuses.some((s) => s.status === 'error');

    let status: 'ok' | 'degraded' | 'error' = 'ok';
    if (hasError) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '0.1.0',
      cache: cache.getStats(),
      sources: sourceHealth,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
      },
    };
  };

  app.get('/health', handler);
  app.get('/v1/health', handler);
}
