import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseRssXml,
  sanitizeTitle,
  isValidHttpUrl,
  clearNewsCache,
  fetchNewsData,
} from '../src/sources/news.js';

describe('News Source & Parsing Tests', () => {
  beforeEach(() => {
    clearNewsCache();
    vi.restoreAllMocks();
  });

  it('sanitizes HTML tags, control chars, HTML entities, and caps length at 200', () => {
    const raw = '<b>Headline</b> &amp; title \u0000 with control \u001F chars and ' + 'a'.repeat(300);
    const sanitized = sanitizeTitle(raw);
    expect(sanitized).not.toContain('<b>');
    expect(sanitized).not.toContain('\u0000');
    expect(sanitized).toContain('Headline & title');
    expect(sanitized.length).toBeLessThanOrEqual(200);
  });

  it('validates HTTP and HTTPS links, rejecting javascript: and data: URLs', () => {
    expect(isValidHttpUrl('https://thehindu.com/article1')).toBe(true);
    expect(isValidHttpUrl('http://indianexpress.com/article2')).toBe(true);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html,hack')).toBe(false);
    expect(isValidHttpUrl('invalid-url')).toBe(false);
  });

  it('parses RSS XML, filters out malformed items, and normalizes fields', () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <item>
            <title><![CDATA[ Good Headline 1 ]]></title>
            <link>https://example.com/article1</link>
            <pubDate>Mon, 05 Oct 2026 12:00:00 GMT</pubDate>
          </item>
          <item>
            <title>Bad Link Item</title>
            <link>javascript:badLink()</link>
            <pubDate>Mon, 05 Oct 2026 13:00:00 GMT</pubDate>
          </item>
          <item>
            <title></title>
            <link>https://example.com/empty-title</link>
          </item>
        </channel>
      </rss>
    `;

    const items = parseRssXml(xml, 'Test Publisher');
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Good Headline 1');
    expect(items[0].link).toBe('https://example.com/article1');
    expect(items[0].source).toBe('Test Publisher');
  });

  it('fetches feeds, merges, dedupes, sorts newest first, and caps at limit', async () => {
    const sampleXml1 = `
      <rss><channel><item>
        <title>Headline Alpha</title>
        <link>https://thehindu.com/alpha</link>
        <pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate>
      </item></channel></rss>
    `;
    const sampleXml2 = `
      <rss><channel><item>
        <title>Headline Beta</title>
        <link>https://indianexpress.com/beta</link>
        <pubDate>Mon, 05 Oct 2026 14:00:00 GMT</pubDate>
      </item></channel></rss>
    `;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const uStr = String(url);
      if (uStr.includes('thehindu.com')) {
        return new Response(sampleXml1, { status: 200 });
      }
      if (uStr.includes('indianexpress.com')) {
        return new Response(sampleXml2, { status: 200 });
      }
      return new Response('', { status: 500 });
    });

    const result = await fetchNewsData(10);
    expect(result.status).toBe('fresh');
    expect(result.data.items.length).toBe(2);
    // Sort newest first: Beta (14:00) should come before Alpha (10:00)
    expect(result.data.items[0].title).toBe('Headline Beta');
    expect(result.data.items[1].title).toBe('Headline Alpha');
    expect(result.data.unavailableSources?.length).toBe(3); // 3 of 5 feeds failed
  });

  it('handles partial feed failures: 2 of 5 fail, returns rest as fresh with unavailableSources listed', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const uStr = String(url);
      if (uStr.includes('thehindu.com') || uStr.includes('indianexpress.com') || uStr.includes('timesofindia')) {
        return new Response(`<rss><channel><item><title>Item from ${uStr}</title><link>https://example.com/ok</link></item></channel></rss>`, { status: 200 });
      }
      return new Response('Server Error', { status: 500 });
    });

    const result = await fetchNewsData(5);
    expect(result.status).toBe('fresh');
    expect(result.data.unavailableSources).toBeDefined();
    expect(result.data.unavailableSources).toContain('Hindustan Times');
    expect(result.data.unavailableSources).toContain('NDTV');
  });

  it('falls back to demo sample headlines when all feeds fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));

    const result = await fetchNewsData(5);
    expect(result.status).toBe('demo');
    expect(result.data.items.length).toBeGreaterThan(0);
    expect(result.data.items[0].title).toContain('Sample:');
  });
});
