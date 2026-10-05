# VedaSphere

> **A trusted daily city brief for Indian families, in their language: one calm screen that answers "what do I need to know today in my city?" with advice, not just data.**

VedaSphere translates raw city data (weather, AQI, news, fuel/gold prices, market snapshots) into concise, actionable daily guidance in English, Hindi, and Telugu.

---

## Key Principles
1. **Advice Over Raw Data**: One number plus one plain line of meaning (e.g. "AQI 180 (Moderate) - wear a mask outside").
2. **Source & Recency**: Every card displays source attribution and "Updated X min ago".
3. **No Bare Errors**: Graceful fallbacks: **Fresh** -> **Stale** (last good data) -> **Demo** sample data.
4. **Fast & Light**: Designed for 4G connections, sub-3s first content load.
5. **Calm & Ad-Free**: No ads, no affiliate links, no jobs section.
6. **Privacy First (DPDP Act 2023)**: Minimum data collection, consent first, instant account & data deletion.

---

## Architecture Overview
Monorepo workspace powered by TypeScript:
- **`apps/web`**: Next.js App Router PWA with Tailwind CSS & i18n support (en, hi, te).
- **`apps/api`**: Node 20+ Fastify API with Zod validation, Pino logging, Helmet security, rate limiting, and in-memory LRU cache.
- **`packages/shared`**: Shared Zod schemas, TypeScript types, contract interfaces.

---

## Quick Start (Local Development)

### 1. Requirements
- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose (optional, for local Postgres)

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run System Doctor & Generate Docs
```bash
npm run doctor
npm run generate-docs
```

### 5. Start Development
```bash
npm run dev
```

### 6. Run Tests
```bash
npm run test
```

---

## Project Structure
```text
veda-sphere/
├── apps/
│   ├── api/             # Fastify API service
│   └── web/             # Next.js frontend application
├── packages/
│   └── shared/          # Shared Zod schemas & TypeScript types
├── scripts/             # System doctor & doc generation scripts
├── docs/                # Architectural & design documentation
├── DATA_SOURCES.md      # Registered data sources & attribution
├── docker-compose.yml   # PostgreSQL local development setup
└── .env.example         # Environment template
```
