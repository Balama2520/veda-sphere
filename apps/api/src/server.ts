import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createCache, Cache } from './cache/index.js';
import { globalSourceRegistry } from './sources/types.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerCityRoutes } from './routes/cities.js';
import { registerWeatherRoutes } from './routes/weather.js';

export interface ServerOptions {
  cache?: Cache;
  logger?: boolean;
}

export async function buildServer(options: ServerOptions = {}): Promise<{ app: FastifyInstance; cache: Cache }> {
  const cache = options.cache || createCache();

  const app = Fastify({
    logger: options.logger ?? {
      level: process.env.LOG_LEVEL || 'info',
      redact: ['headers.authorization', 'req.headers.cookie', 'email', 'token'],
    },
    disableRequestLogging: false,
  });

  // Security headers via helmet
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  // CORS configuration (strictly allowed origin from env)
  const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  await app.register(cors, {
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Load configured sources into health registry
  try {
    const configPath = join(process.cwd(), 'config', 'sources.json');
    const sourcesConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (Array.isArray(sourcesConfig.sources)) {
      for (const source of sourcesConfig.sources) {
        globalSourceRegistry.register({
          id: source.id,
          name: source.name,
          url: source.url,
          attribution: source.attribution,
          ttlSeconds: source.ttlSeconds,
        });
      }
    }
  } catch (err) {
    app.log.warn({ err }, 'Failed to load sources.json config into registry');
  }

  // Consistent Error Handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    const code = error.code || (statusCode === 429 ? 'RATE_LIMITED' : 'INTERNAL_SERVER_ERROR');

    reply.status(statusCode).send({
      error: {
        code,
        message: error.message || 'An unexpected error occurred',
      },
    });
  });

  // Register Routes
  registerHealthRoutes(app, cache);
  registerCityRoutes(app, cache);
  registerWeatherRoutes(app, cache);

  return { app, cache };
}
