import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SourceEntry {
  id: string;
  name: string;
  url: string;
  ttlSeconds: number;
  refreshIntervalSeconds: number;
  terms: string;
  attribution: string;
}

function generateDataSourcesMd() {
  const configPath = join(process.cwd(), 'apps', 'api', 'config', 'sources.json');
  const outputPath = join(process.cwd(), 'DATA_SOURCES.md');

  const configContent = readFileSync(configPath, 'utf-8');
  const data = JSON.parse(configContent);
  const sources: SourceEntry[] = data.sources || [];

  let md = `# VedaSphere Data Sources & Attribution

This document is auto-generated from \`apps/api/config/sources.json\`. All data sources used by VedaSphere adhere to strict privacy, fetch safety, and attribution requirements.

## Principles for External Data
1. **No Bare Errors**: Fallback hierarchy: fresh data -> last good data (labelled STALE) -> DEMO sample data (labelled DEMO).
2. **Attribution & Terms**: Every card displays clear source attribution and updated timestamps.
3. **Fetch Safety**: All requests pass through an allowlisted proxy with 5s timeouts and response size limits.

## Registered Sources Index

| Source ID | Name | Refresh Interval | TTL (s) | Terms / Licensing |
| --- | --- | --- | --- | --- |
`;

  sources.forEach((s) => {
    md += `| \`${s.id}\` | [${s.name}](${s.url}) | ${s.refreshIntervalSeconds}s | ${s.ttlSeconds}s | ${s.terms} |\n`;
  });

  md += `\n## Detailed Source Descriptions\n\n`;

  sources.forEach((s) => {
    md += `### ${s.name} (\`${s.id}\`)\n`;
    md += `- **URL**: [${s.url}](${s.url})\n`;
    md += `- **Refresh Interval**: Every ${s.refreshIntervalSeconds} seconds\n`;
    md += `- **Cache TTL**: ${s.ttlSeconds} seconds\n`;
    md += `- **Attribution Text**: "${s.attribution}"\n`;
    md += `- **Terms & Notes**: ${s.terms}\n\n`;
  });

  md += `---
*Last updated: ${new Date().toISOString()}*\n`;

  writeFileSync(outputPath, md, 'utf-8');
  console.log(`Generated DATA_SOURCES.md successfully from ${sources.length} sources.`);
}

generateDataSourcesMd();
