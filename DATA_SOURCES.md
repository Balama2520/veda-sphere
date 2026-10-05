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
| `open-meteo-aqi` | [Open-Meteo Air Quality API (CAMS model)](https://air-quality-api.open-meteo.com/v1/air-quality) | 1800s | 1800s | Non-commercial open database license (CC BY 4.0). Model-based CAMS-derived data – NOT ground station readings. Attribution required for public use. AQI calculated using unverified CPCB National AQI sub-index formula applied to PM2.5 and PM10 (µg/m³, hourly). Configurable TTL via AQI_TTL_SECONDS env var. |
| `the-hindu-rss` | [The Hindu National RSS](https://www.thehindu.com/news/national/feeder/default.rss) | 300s | 300s | Public RSS feed used for headline links only. No article body copying. |
| `indian-express-rss` | [Indian Express RSS](https://indianexpress.com/feed/) | 300s | 300s | Public RSS feed used for headline links only. No article body copying. |
| `times-of-india-rss` | [Times of India RSS](https://timesofindia.indiatimes.com/rssfeedstopstories.cms) | 300s | 300s | Public RSS feed used for headline links only. No article body copying. |
| `hindustan-times-rss` | [Hindustan Times India RSS](https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml) | 300s | 300s | Public RSS feed used for headline links only. No article body copying. |
| `ndtv-rss` | [NDTV Top Stories RSS](https://feeds.feedburner.com/ndtvnews-top-stories) | 300s | 300s | Public RSS feed used for headline links only. No article body copying. |
| `frankfurter-currency` | [Frankfurter Currency API](https://api.frankfurter.dev/v1/latest) | 3600s | 3600s | Open data published by European Central Bank. Free reference rates for commercial and non-commercial use. |
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

### Open-Meteo Air Quality API (CAMS model) (`open-meteo-aqi`)
- **URL**: [https://air-quality-api.open-meteo.com/v1/air-quality](https://air-quality-api.open-meteo.com/v1/air-quality)
- **Refresh Interval**: Every 1800 seconds
- **Cache TTL**: 1800 seconds
- **Attribution Text**: "Air quality forecast data by Open-Meteo.com (CC BY 4.0) using Copernicus Atmosphere Monitoring Service (CAMS) model by ECMWF. Sub-index AQI calculated via unverified CPCB formula."
- **Terms & Notes**: Non-commercial open database license (CC BY 4.0). Model-based CAMS-derived data – NOT ground station readings. Attribution required for public use. AQI calculated using unverified CPCB National AQI sub-index formula applied to PM2.5 and PM10 (µg/m³, hourly). Configurable TTL via AQI_TTL_SECONDS env var.

### The Hindu National RSS (`the-hindu-rss`)
- **URL**: [https://www.thehindu.com/news/national/feeder/default.rss](https://www.thehindu.com/news/national/feeder/default.rss)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines from The Hindu"
- **Terms & Notes**: Public RSS feed used for headline links only. No article body copying.

### Indian Express RSS (`indian-express-rss`)
- **URL**: [https://indianexpress.com/feed/](https://indianexpress.com/feed/)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines from The Indian Express"
- **Terms & Notes**: Public RSS feed used for headline links only. No article body copying.

### Times of India RSS (`times-of-india-rss`)
- **URL**: [https://timesofindia.indiatimes.com/rssfeedstopstories.cms](https://timesofindia.indiatimes.com/rssfeedstopstories.cms)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines from The Times of India"
- **Terms & Notes**: Public RSS feed used for headline links only. No article body copying.

### Hindustan Times India RSS (`hindustan-times-rss`)
- **URL**: [https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml](https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines from Hindustan Times"
- **Terms & Notes**: Public RSS feed used for headline links only. No article body copying.

### NDTV Top Stories RSS (`ndtv-rss`)
- **URL**: [https://feeds.feedburner.com/ndtvnews-top-stories](https://feeds.feedburner.com/ndtvnews-top-stories)
- **Refresh Interval**: Every 300 seconds
- **Cache TTL**: 300 seconds
- **Attribution Text**: "Headlines from NDTV"
- **Terms & Notes**: Public RSS feed used for headline links only. No article body copying.

### Frankfurter Currency API (`frankfurter-currency`)
- **URL**: [https://api.frankfurter.dev/v1/latest](https://api.frankfurter.dev/v1/latest)
- **Refresh Interval**: Every 3600 seconds
- **Cache TTL**: 3600 seconds
- **Attribution Text**: "Reference rates provided by Frankfurter / European Central Bank"
- **Terms & Notes**: Open data published by European Central Bank. Free reference rates for commercial and non-commercial use.

### VedaSphere Demo Price Provider (`demo-prices-provider`)
- **URL**: [https://vedasphere.local/demo/prices](https://vedasphere.local/demo/prices)
- **Refresh Interval**: Every 3600 seconds
- **Cache TTL**: 3600 seconds
- **Attribution Text**: "Demo sample data - VedaSphere internal provider"
- **Terms & Notes**: Simulated local retail fuel, gold/silver, and delayed index values for demonstration.

---
*Last updated: 2026-10-05T14:30:02.038Z*
