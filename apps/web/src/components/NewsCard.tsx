import React from 'react';
import { NormalizedResult, NewsData } from '@vedasphere/shared';

interface NewsCardProps {
  data?: NormalizedResult<NewsData>;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

function getRelativeTimeString(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return 'recently';
  }
}

export function NewsCard({ data, isLoading, isError, errorMessage }: NewsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card border border-border animate-pulse space-y-3">
        <div className="h-5 w-32 bg-surface-2 rounded" />
        <div className="space-y-2 pt-2">
          <div className="h-4 bg-surface-2 rounded w-full" />
          <div className="h-4 bg-surface-2 rounded w-5/6" />
          <div className="h-4 bg-surface-2 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card border border-border">
        <h3 className="font-semibold text-ink text-base mb-2">Top Headlines</h3>
        <p className="text-sm text-status-warning font-medium">
          {errorMessage || 'Unable to load headlines at this moment.'}
        </p>
      </div>
    );
  }

  const { items, unavailableSources } = data.data;
  const status = data.status;
  const topItems = items.slice(0, 3);

  const statusColors = {
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stale: 'bg-amber-50 text-amber-700 border-amber-200',
    demo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="bg-surface rounded-card p-5 shadow-card border border-border transition-all">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📰</span>
          <h3 className="font-semibold text-ink text-base">Top Headlines</h3>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
            statusColors[status] || statusColors.fresh
          }`}
        >
          {status}
        </span>
      </div>

      {unavailableSources && unavailableSources.length > 0 && (
        <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-btn text-xs text-amber-800 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>Some sources are unavailable</span>
        </div>
      )}

      <div className="space-y-3 divide-y divide-border/60">
        {topItems.length === 0 ? (
          <p className="text-sm text-muted py-2">No headlines available right now.</p>
        ) : (
          topItems.map((item, idx) => (
            <div key={item.id || idx} className={idx > 0 ? 'pt-3' : ''}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <h4 className="text-sm font-medium text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted mt-1.5">
                  <span className="font-semibold text-ink/70">{item.source}</span>
                  <span>{getRelativeTimeString(item.publishedAt)}</span>
                </div>
              </a>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
        <span>Headlines from Indian news sites, links open original</span>
        <span>Updated {getRelativeTimeString(data.updatedAt)}</span>
      </div>
    </div>
  );
}
