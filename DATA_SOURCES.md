# VedaSphere Data Sources & Attribution

This document is auto-generated from `apps/api/config/sources.json`. All data sources used by VedaSphere adhere to strict privacy, fetch safety, and attribution requirements.

## Principles for External Data
1. **No Bare Errors**: Fallback hierarchy: fresh data -> last good data (labelled STALE) -> DEMO sample data (labelled DEMO).
2. **Attribution & Terms**: Every card displays clear source attribution and updated timestamps.
3. **Fetch Safety**: All requests pass through an allowlisted proxy with 5s timeouts and response size limits.

## Registered Sources Index

| Source ID | Name | Refresh Interval | TTL (s) | Terms / Licensing |
| --- | --- | --- | --- | --- |
| `open-meteo-weather` | [Open-Meteo Weather API](https://api.open-meteo.com/v1/forecast) | 900s | 900s | Non-commercial open database license. Attribution required for public use. |
| `open-meteo-geocoding` | [Open-Meteo Geocoding API](https://geocoding-api.open-meteo.com/v1/search) | 86400s | 86400s | Non-commercial open database license. Free geocoding search for city locations. |
| `open-meteo-aqi` | [Open-Meteo Air Quality API](https://air-quality-api.open-meteo.com/v1/air-quality) | 1800s | 1800s | Non-commercial open database license. Estimated CPCB sub-index model calculation. |
| `indian-news-rss` | [Public News RSS Feeds](https://news.google.com/rss) | 300s | 300s | Public RSS feeds stored as headlines and links only. No article body copying. |
| `frankfurter-currency` | [Frankfurter Currency API](https://api.frankfurter.app) | 3600s | 3600s | Open data published by European Central Bank. Free reference rates. |
| `demo-prices-provider` | [VedaSphere Demo Price Provider](https://vedasphere.local/demo/prices) | 3600s | 3600s | Simulated local retail fuel, gold/silver, and delayed index values for demonstration. |

## Detailed Source Descriptions

### Open-Meteo Weather API (`open-meteo-weather`)
- **URL**: [https://api.open-meteo.com/v1/forecast](https://api.open-meteo.com/v1/forecast)
- **Refresh Interval**: Every 900 seconds
- **Cache TTL**: 900 seconds
- **Attribution Text**: "Weather data by Open-Meteo.com (CC BY 4.0)"
- **Terms & Notes**: Non-commercial open database license. Attribution required for public use.

### Open-Meteo Geocoding API (`open-meteo-geocoding`)
- **URL**: [https://geocoding-api.open-meteo.com/v1/search](https://geocoding-api.open-meteo.com/v1/search)
- **Refresh Interval**: Every 86400 seconds
- **Cache TTL**: 86400 seconds
- **Attribution Text**: "Geocoding data by Open-Meteo.com (CC BY 4.0)"
- **Terms & Notes**: Non-commercial open database license. Free geocoding search for city locations.

### Open-Meteo Air Quality API (`open-meteo-aqi`)
- **URL**: [https://air-quality-api.open-meteo.com/v1/air-quality](https://air-quality-api.open-meteo.com/v1/air-quality)
- **Refresh Interval**: Every 1800 seconds
- **Cache TTL**: 1800 seconds
- **Attribution Text**: "Air Quality data by Open-Meteo.com (CC BY 4.0) with CPCB sub-index calculation"
- **Terms & Notes**: Non-commercial open database license. Estimated CPCB sub-index model calculation.

### Public News RSS Feeds (`indian-news-rss`)
- **URL**: [https://news.google.com/rss](https://news.google.com/rss)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines sourced from public RSS feeds"
- **Terms & Notes**: Public RSS feeds stored as headlines and links only. No article body copying.

### Frankfurter Currency API (`frankfurter-currency`)
- **URL**: [https://api.frankfurter.app](https://api.frankfurter.app)
- **Refresh Interval**: Every 3600 seconds
- **Cache TTL**: 3600 seconds
- **Attribution Text**: "Rates provided by Frankfurter / European Central Bank"
- **Terms & Notes**: Open data published by European Central Bank. Free reference rates.

### VedaSphere Demo Price Provider (`demo-prices-provider`)
- **URL**: [https://vedasphere.local/demo/prices](https://vedasphere.local/demo/prices)
- **Refresh Interval**: Every 3600 seconds
- **Cache TTL**: 3600 seconds
- **Attribution Text**: "Demo sample data - VedaSphere internal provider"
- **Terms & Notes**: Simulated local retail fuel, gold/silver, and delayed index values for demonstration.

---
*Last updated: 2026-10-05T07:24:40.082Z*
