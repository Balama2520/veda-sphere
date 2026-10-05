# VedaSphere System Architecture

## 1. Overview
VedaSphere is built as a high-reliability, low-latency daily city briefing platform tailored for Indian families. It transforms fragmented city data streams into unified, localized, and actionable advice.

---

## 2. Monorepo Architecture

```
                       ┌───────────────────────┐
                       │     apps/web          │
                       │ (Next.js PWA Client)  │
                       └───────────┬───────────┘
                                   │ HTTP / REST / SSE
                                   ▼
                       ┌───────────────────────┐
                       │     apps/api          │
                       │ (Fastify REST Server) │
                       └───────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │ Cache Layer      │ │ Worker Scheduler │ │ AI Agent Engine  │
     │ (LRU+TTL / Redis)│ │ (node-cron)      │ │ (Anthropic SDK)  │
     └──────────────────┘ └──────────────────┘ └──────────────────┘
                                   │ Shared Contracts
                                   ▼
                       ┌───────────────────────┐
                       │   packages/shared     │
                       │ (Zod Schemas + Types) │
                       └───────────────────────┘
```

---

## 3. Core Data Contracts

### 3.1 Source Module Contract
Every external data provider in `apps/api/src/sources` adheres to the normalized output contract:

```typescript
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
  updatedAt: string; // ISO 8601 UTC string
  status: DataStatus;
}
```

### 3.2 Resilient Fallback Strategy
A card in VedaSphere **never** shows a raw error.
1. **FRESH**: Data fetched successfully within TTL window.
2. **STALE**: Upstream call failed; returning last known good cached snapshot.
3. **DEMO**: No snapshot available yet; returning structured demo sample data explicitly tagged `status: "demo"`.

---

## 4. Cache & Worker Architecture

- **Cache Interface**: Abstraction layer supporting in-memory LRU + TTL eviction out-of-the-box, with seamless Redis driver drop-in via environment configuration (`CACHE_DRIVER=redis`).
- **Worker Scheduler**: Background cron process (`apps/api/src/worker.ts`) pre-fetches data for high-density cities (weather every 15 min, AQI every 30 min, news every 5 min, currency & gold every 60 min).
- **Request Coalescing**: Concurrent API requests for the same city/source collapse into a single upstream request, preventing stampedes and rate-limit exhaustion.

---

## 5. Security & Privacy (India DPDP Act 2023 Compliance)

1. **Minimal Data Collection**: Location requested on demand; no background tracking.
2. **Consent & Right to be Forgotten**: Consent flags recorded in `consents` table; `DELETE /me` erases user profile, preferences, and logged AI chats immediately.
3. **API Hardening**: Helmet HTTP headers, strict CORS, rate-limiting per IP and per user ID, Zod request payload validation, and Pino automatic PII redaction (email, authorization tokens).
4. **Fetch Safety**: Allowlisted external URLs, 5s request timeout, 1MB payload caps, and zero user-controlled outbound URL execution (SSRF protection).
