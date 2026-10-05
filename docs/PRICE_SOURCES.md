# VedaSphere Local & Retail Price Data Sources Research

This document analyzes candidate upstream data sources for retail prices in India across three primary categories: Retail Fuel, Precious Metals (Gold/Silver), and Stock Market Indices. **None of these APIs are currently wired into production code; VedaSphere currently uses `DemoPriceProvider` with sample labels.**

---

## 1. Retail Fuel Prices (Petrol & Diesel in Indian Cities)

### Candidate 1: RapidAPI - Petrol/Diesel Price India API
- **Provider / Endpoint**: `https://rapidapi.com/` (Search: Indian Fuel Price API)
- **Coverage**: City-wise petrol and diesel prices updated daily for IOCL, BPCL, HPCL.
- **Terms & Licensing**: Free tier (50 requests/day), paid tiers available. Requires RapidAPI key header.
- **Redistribution**: Allowed for aggregated display with attribution.
- **Pros/Cons**: Easy JSON format per city; relies on unofficial RapidAPI wrapper.

### Candidate 2: Government Open Data (data.gov.in - OGD Platform India)
- **Provider / Endpoint**: `https://api.data.gov.in/resource/` (Ministry of Petroleum & Natural Gas)
- **Coverage**: Daily retail selling prices of Petrol & Diesel across major metro cities in India.
- **Terms & Licensing**: Government Open Data License - India (OGDL). Free for commercial and non-commercial use with attribution.
- **Redistribution**: Fully permitted.
- **Pros/Cons**: Official government data; occasional API latency or data publication delays.

### Candidate 3: Scraping Major IOCL/BPCL Public Portals (Not Recommended)
- **Provider**: Public portals of Indian Oil Corporation Ltd / Bharat Petroleum.
- **Coverage**: Direct oil company daily price revisions.
- **Terms**: Web terms forbid automated scraping without prior written consent.
- **Verdict**: Rejected due to scraping policy constraints.

---

## 2. Precious Metals (Gold & Silver Prices in India)

### Candidate 1: GoldAPI.io
- **Provider / Endpoint**: `https://www.goldapi.io/api/XAU/INR` and `https://www.goldapi.io/api/XAG/INR`
- **Coverage**: Live spot prices for Gold (24K, 22K) and Silver in INR per gram/ounce.
- **Terms & Licensing**: Free tier (100 requests/month), paid plans starting at \$15/month.
- **Redistribution**: Allowed on paid tiers with source attribution.
- **Pros/Cons**: Clean REST JSON API, reliable uptime; free tier rate limit is very low.

### Candidate 2: Metals-API
- **Provider / Endpoint**: `https://metals-api.com/api/latest?base=INR&symbols=LHK,XAU,XAG`
- **Coverage**: Spot gold and silver exchange rates in INR.
- **Terms & Licensing**: Free tier (50 requests/month), commercial plans required for live feeds.
- **Redistribution**: Requires commercial license.
- **Pros/Cons**: Standard exchange rate structure; strict redistribution limits on free key.

### Candidate 3: IBJA (India Bullion and Jewellers Association) Rates
- **Provider / Endpoint**: `https://ibja.co/`
- **Coverage**: Benchmark daily gold & silver rates published twice daily in India (morning/evening).
- **Terms & Licensing**: Proprietary benchmark. Redistribution requires formal subscription/licensing.
- **Pros/Cons**: Official Indian retail gold benchmark; no public free API.

---

## 3. Stock Market Indices (Nifty 50, Sensex)

### Candidate 1: Alpha Vantage
- **Provider / Endpoint**: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NSE:NIFTY`
- **Coverage**: Delayed 15-minute quote data for global and Indian market indices.
- **Terms & Licensing**: Free API key (25 requests/day limit), commercial keys available.
- **Redistribution**: Allowed with 15-minute delayed label.
- **Pros/Cons**: Established provider; free tier rate limit is tight.

### Candidate 2: Yahoo Finance API (via YFinance / RapidAPI)
- **Provider / Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart/%5ECNSE` (Nifty 50) and `%5EBSESN` (Sensex)
- **Coverage**: 15-minute delayed index values for NSE Nifty 50 (`^NSEI`) and BSE Sensex (`^BSESN`).
- **Terms & Licensing**: Unofficial endpoint; terms forbid automated commercial use without license.
- **Redistribution**: Strictly delayed (15 min) for personal/non-commercial use.
- **Pros/Cons**: Real market numbers, but endpoint stability is un-guaranteed.

### Candidate 3: BSE India / NSE India Official Data Feeds
- **Provider / Endpoint**: NSE Data & Analytics Ltd / BSE Ltd
- **Coverage**: Real-time and delayed index feeds directly from exchanges.
- **Terms & Licensing**: Commercial license agreement required.
- **Redistribution**: Allowed only under paid redistribution license.
- **Pros/Cons**: Highest reliability and accuracy; high commercial licensing cost.
