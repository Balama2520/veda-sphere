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

export interface CityItem {
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  city: string;
  temperatureC: number;
  humidity: number;
  rainChancePercent: number;
  todayMaxC: number;
  conditionLabel: string;
  advice: string;
}

export type AqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe';

export type DominantPollutant = 'PM2.5' | 'PM10' | 'None';

export type AqiBasis = '24h-average' | 'latest-hour';

export interface AqiData {
  city: string;
  aqi: number;
  category: AqiCategory;
  dominantPollutant: DominantPollutant;
  subIndices: {
    pm25: number | null;
    pm10: number | null;
  };
  basis: AqiBasis;
  advice: string;
  kind: 'model-estimate';
  userNote: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
}

export interface NewsData {
  items: NewsItem[];
  unavailableSources?: string[];
}

export interface CurrencyRates {
  usdInr: number;
  eurInr: number;
  gbpInr: number;
  rateDate: string;
  note: string;
}

export interface FuelPriceItem {
  petrolPerLitre: number;
  dieselPerLitre: number;
  unit: string;
  status: DataStatus;
  isSample: boolean;
  note: string;
}

export interface PreciousMetalsItem {
  gold24kPer10g: number;
  silverPerKg: number;
  unit: string;
  status: DataStatus;
  isSample: boolean;
  note: string;
}

export interface MarketIndexItem {
  nifty50: number;
  sensex: number;
  status: DataStatus;
  isSample: boolean;
  isDelayed: boolean;
  note: string;
}

export interface PricesData {
  city: string;
  currency: {
    usdInr: number;
    eurInr: number;
    gbpInr: number;
    rateDate: string;
    note: string;
    status: DataStatus;
  };
  fuel: FuelPriceItem;
  preciousMetals: PreciousMetalsItem;
  marketIndex: MarketIndexItem;
}

export type AdviceSeverity = 'info' | 'caution' | 'warning';

export interface BriefLine {
  id: string;
  icon: string; // e.g. "umbrella", "sun", "wind"
  text: string;
  severity: AdviceSeverity;
  sourceId: string;
  status: DataStatus;
  updatedAt: string;
}

export interface BriefResponse {
  city: string;
  generatedAt: string;
  lines: BriefLine[];
  weather: NormalizedResult<WeatherData>;
  aqi: NormalizedResult<AqiData>;
  news: NormalizedResult<NewsData>;
  prices: NormalizedResult<PricesData>;
  overallStatus: DataStatus;
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
