export type DataStatus = 'fresh' | 'stale' | 'demo';

export interface SourceInfo {
  id: string;
  name: string;
  url: string;
  attribution?: string;
  ttlSeconds?: number;
}

export interface NormalizedResult<T = unknown> {
  data: T;
  source: SourceInfo;
  updatedAt: string; // ISO 8601 string
  status: DataStatus;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface SourceHealthStatus {
  id: string;
  name: string;
  status: DataStatus | 'error' | 'unknown';
  lastSuccess: string | null;
  lastError?: string | null;
  consecutiveFailures: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  cache: CacheStats;
  sources: Record<string, SourceHealthStatus>;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
