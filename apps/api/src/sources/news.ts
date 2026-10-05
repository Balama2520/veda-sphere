import { XMLParser } from 'fast-xml-parser';
import { NormalizedResult, NewsData, NewsItem, DataStatus } from '@vedasphere/shared';
import { globalSourceRegistry } from './types.js';

export interface NewsSourceConfig {
  id: string;
  name: string;
  url: string;
  publisher: string;
}

export const APPROVED_NEWS_FEEDS: NewsSourceConfig[] = [
  {
    id: 'the-hindu-rss',
    name: 'The Hindu National',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    publisher: 'The Hindu',
  },
  {
    id: 'indian-express-rss',
    name: 'Indian Express',
    url: 'https://indianexpress.com/feed/',
    publisher: 'Indian Express',
  },
  {
    id: 'times-of-india-rss',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    publisher: 'Times of India',
  },
  {
    id: 'hindustan-times-rss',
    name: 'Hindustan Times',
    url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
    publisher: 'Hindustan Times',
  },
];

const ALLOWLISTED_HOSTS = new Set([
  'www.thehindu.com',
  'thehindu.com',
  'indianexpress.com',
  'www.indianexpress.com',
  'timesofindia.indiatimes.com',
  'www.hindustantimes.com',
  'hindustantimes.com',
  'feeds.feedburner.com',
  'cdn.ndtv.com',
  'www.ndtv.com',
  'ndtv.com',
]);

const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1024 * 1024; // 1 MB cap

export function sanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') return '';
  // Strip HTML tags
  let cleaned = title.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Remove control characters (including zero-width chars and control ASCII)
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Trim to 200 chars
  return cleaned.slice(0, 200);
}

export function isValidHttpUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeTitleForDedupe(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function fetchWithRetryAndCap(url: string, retries = 2): Promise<string> {
  const parsed = new URL(url);
  if (!ALLOWLISTED_HOSTS.has(parsed.hostname)) {
    throw new Error(`Host ${parsed.hostname} is not in allowlist`);
  }

  let attempt = 0;
  let lastErr: Error = new Error('Unknown fetch error');

  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual', // Prevent automatic redirects to un-allowlisted hosts
        headers: {
          'User-Agent': 'VedaSphere/0.1 (+https://github.com/Balama2520/veda-sphere)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400) {
        const redirectLocation = response.headers.get('location');
        if (redirectLocation) {
          const redirectUrl = new URL(redirectLocation, url);
          if (!ALLOWLISTED_HOSTS.has(redirectUrl.hostname)) {
            throw new Error(`Redirect to non-allowlisted host ${redirectUrl.hostname} rejected`);
          }
          // Follow redirect once if allowlisted
          const subRes = await fetch(redirectUrl.toString(), {
            headers: {
              'User-Agent': 'VedaSphere/0.1 (+https://github.com/Balama2520/veda-sphere)',
            },
          });
          const text = await subRes.text();
          if (text.length > MAX_RESPONSE_BYTES) {
            return text.slice(0, MAX_RESPONSE_BYTES);
          }
          return text;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
        throw new Error(`Response payload exceeds maximum allowed size of 1 MB`);
      }

      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        return text.slice(0, MAX_RESPONSE_BYTES);
      }

      return text;
    } catch (err: any) {
      clearTimeout(timer);
      lastErr = err instanceof Error ? err : new Error(String(err));
      attempt++;
      if (attempt <= retries && process.env.NODE_ENV !== 'test') {
        await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastErr;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
});

export function parseRssXml(xmlText: string, publisherName: string): NewsItem[] {
  if (!xmlText || typeof xmlText !== 'string') return [];

  const items: NewsItem[] = [];

  try {
    const parsed = parser.parse(xmlText);
    const channel = parsed?.rss?.channel || parsed?.feed;
    const rawItems = channel?.item || channel?.entry || [];
    const itemArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    for (const raw of itemArray) {
      if (!raw) continue;

      let rawTitle = raw.title;
      if (typeof rawTitle === 'object' && rawTitle !== null) {
        rawTitle = rawTitle['#text'] || rawTitle._ || '';
      }

      let rawLink = raw.link;
      if (typeof rawLink === 'object' && rawLink !== null) {
        rawLink = rawLink['@_href'] || rawLink['#text'] || rawLink._ || '';
      }

      let rawPubDate = raw.pubDate || raw.updated || raw['dc:date'] || '';
      if (typeof rawPubDate === 'object' && rawPubDate !== null) {
        rawPubDate = rawPubDate['#text'] || rawPubDate._ || '';
      }

      const cleanTitle = sanitizeTitle(String(rawTitle || ''));
      const cleanLink = String(rawLink || '').trim();

      if (!cleanTitle || !isValidHttpUrl(cleanLink)) {
        continue; // Skip malformed item
      }

      let isoDate = new Date().toISOString();
      if (rawPubDate) {
        const parsedDate = new Date(String(rawPubDate));
        if (!isNaN(parsedDate.getTime())) {
          isoDate = parsedDate.toISOString();
        }
      }

      items.push({
        id: `news-${publisherName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${items.length + 1}-${Date.now()}`,
        title: cleanTitle,
        link: cleanLink,
        source: publisherName,
        publishedAt: isoDate,
      });
    }
  } catch (e) {
    // Malformed XML skipped silently
  }

  return items;
}

export function generateDemoNews(): NewsItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-news-1',
      title: 'Sample: Reserve Bank of India keeps repo rate unchanged at 6.5%',
      link: 'https://vedasphere.local/demo/news/1',
      source: 'VedaSphere Sample News',
      publishedAt: now,
    },
    {
      id: 'demo-news-2',
      title: 'Sample: ISRO prepares for upcoming Chandrayaan successor mission launch',
      link: 'https://vedasphere.local/demo/news/2',
      source: 'VedaSphere Sample News',
      publishedAt: now,
    },
    {
      id: 'demo-news-3',
      title: 'Sample: Good rainfall across western ghats boosts water reservoir levels',
      link: 'https://vedasphere.local/demo/news/3',
      source: 'VedaSphere Sample News',
      publishedAt: now,
    },
  ];
}

// In-memory cache for news
interface CachedNewsEntry {
  data: NewsData;
  timestamp: number;
}
let newsCache: CachedNewsEntry | null = null;
let pendingNewsPromise: Promise<NormalizedResult<NewsData>> | null = null;

export function clearNewsCache(): void {
  newsCache = null;
  pendingNewsPromise = null;
}

export async function fetchNewsData(limit = 10): Promise<NormalizedResult<NewsData>> {
  const now = Date.now();
  const ttlSeconds = parseInt(process.env.NEWS_TTL_SECONDS || '300', 10);
  const ttlMs = ttlSeconds * 1000;
  const staleMs = 86400 * 1000; // 24 hours

  if (newsCache && now - newsCache.timestamp < ttlMs) {
    return {
      data: {
        items: newsCache.data.items.slice(0, limit),
        unavailableSources: newsCache.data.unavailableSources,
      },
      source: {
        id: 'indian-news-rss',
        name: 'Public News RSS Feeds',
        url: 'https://news.google.com/rss',
        attribution: 'Headlines from Indian news sites',
        ttlSeconds,
      },
      updatedAt: new Date(newsCache.timestamp).toISOString(),
      status: 'fresh',
    };
  }

  if (pendingNewsPromise) {
    const res = await pendingNewsPromise;
    return {
      ...res,
      data: {
        items: res.data.items.slice(0, limit),
        unavailableSources: res.data.unavailableSources,
      },
    };
  }

  pendingNewsPromise = (async () => {
    const allFetchedItems: NewsItem[] = [];
    const unavailableSources: string[] = [];

    await Promise.all(
      APPROVED_NEWS_FEEDS.map(async (feed) => {
        try {
          const xmlText = await fetchWithRetryAndCap(feed.url);
          const feedItems = parseRssXml(xmlText, feed.publisher);
          if (feedItems.length > 0) {
            allFetchedItems.push(...feedItems);
            globalSourceRegistry.recordSuccess(feed.id);
          } else {
            unavailableSources.push(feed.publisher);
            globalSourceRegistry.recordError(feed.id, 'No valid items parsed from feed XML');
          }
        } catch (err: any) {
          unavailableSources.push(feed.publisher);
          globalSourceRegistry.recordError(feed.id, err?.message || 'Failed to fetch RSS feed');
        }
      })
    );

    // If at least one feed succeeded:
    if (allFetchedItems.length > 0) {
      // Deduplicate by normalized title and link URL
      const seenTitles = new Set<string>();
      const seenLinks = new Set<string>();
      const deduped: NewsItem[] = [];

      for (const item of allFetchedItems) {
        const normTitle = normalizeTitleForDedupe(item.title);
        if (seenTitles.has(normTitle) || seenLinks.has(item.link)) {
          continue;
        }
        seenTitles.add(normTitle);
        seenLinks.add(item.link);
        deduped.push(item);
      }

      // Sort newest first
      deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      const newsData: NewsData = {
        items: deduped,
        unavailableSources: unavailableSources.length > 0 ? unavailableSources : undefined,
      };

      newsCache = {
        data: newsData,
        timestamp: now,
      };

      globalSourceRegistry.recordSuccess('indian-news-rss');

      return {
        data: {
          items: newsData.items.slice(0, limit),
          unavailableSources: newsData.unavailableSources,
        },
        source: {
          id: 'indian-news-rss',
          name: 'Public News RSS Feeds',
          url: 'https://news.google.com/rss',
          attribution: 'Headlines from Indian news sites',
          ttlSeconds,
        },
        updatedAt: new Date(now).toISOString(),
        status: 'fresh' as DataStatus,
      };
    }

    // All feeds failed! Check stale cache:
    if (newsCache && now - newsCache.timestamp < staleMs) {
      return {
        data: {
          items: newsCache.data.items.slice(0, limit),
          unavailableSources: APPROVED_NEWS_FEEDS.map((f) => f.publisher),
        },
        source: {
          id: 'indian-news-rss',
          name: 'Public News RSS Feeds',
          url: 'https://news.google.com/rss',
          attribution: 'Headlines from Indian news sites (stale fallback)',
          ttlSeconds,
        },
        updatedAt: new Date(newsCache.timestamp).toISOString(),
        status: 'stale' as DataStatus,
      };
    }

    const demoItems = generateDemoNews();
    const demoData: NewsData = {
      items: demoItems,
      unavailableSources: APPROVED_NEWS_FEEDS.map((f) => f.publisher),
    };

    newsCache = {
      data: demoData,
      timestamp: now,
    };

    return {
      data: {
        items: demoItems.slice(0, limit),
        unavailableSources: demoData.unavailableSources,
      },
      source: {
        id: 'indian-news-rss',
        name: 'VedaSphere Demo News Provider',
        url: 'https://vedasphere.local/demo/news',
        attribution: 'Demo sample headlines - VedaSphere internal provider',
        ttlSeconds,
      },
      updatedAt: new Date(now).toISOString(),
      status: 'demo' as DataStatus,
    };
  })();

  try {
    return await pendingNewsPromise;
  } finally {
    pendingNewsPromise = null;
  }
}
