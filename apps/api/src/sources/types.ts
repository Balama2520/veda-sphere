import { NormalizedResult, SourceHealthStatus, SourceInfo } from '@vedasphere/shared';

export interface SourceFetchParams {
  city?: string;
  [key: string]: unknown;
}

export interface DataSourceModule<T = unknown> {
  info: SourceInfo;
  fetch(params: SourceFetchParams): Promise<NormalizedResult<T>>;
}

export class SourceRegistry {
  private healthStatuses = new Map<string, SourceHealthStatus>();

  register(source: SourceInfo): void {
    if (!this.healthStatuses.has(source.id)) {
      this.healthStatuses.set(source.id, {
        id: source.id,
        name: source.name,
        status: 'unknown',
        lastSuccess: null,
        lastError: null,
        consecutiveFailures: 0,
      });
    }
  }

  recordSuccess(sourceId: string, status: 'fresh' | 'stale' | 'demo' = 'fresh'): void {
    const current = this.healthStatuses.get(sourceId);
    if (current) {
      current.status = status;
      current.lastSuccess = new Date().toISOString();
      current.consecutiveFailures = 0;
      current.lastError = null;
    }
  }

  recordError(sourceId: string, error: Error | string): void {
    const current = this.healthStatuses.get(sourceId);
    if (current) {
      current.status = 'error';
      current.lastError = typeof error === 'string' ? error : error.message;
      current.consecutiveFailures += 1;
    }
  }

  getHealthSummary(): Record<string, SourceHealthStatus> {
    const result: Record<string, SourceHealthStatus> = {};
    for (const [id, status] of this.healthStatuses.entries()) {
      result[id] = { ...status };
    }
    return result;
  }
}

export const globalSourceRegistry = new SourceRegistry();
