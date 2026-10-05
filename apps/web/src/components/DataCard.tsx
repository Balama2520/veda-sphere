'use client';

import React, { useState, useEffect } from 'react';
import { NormalizedResult, WeatherData, DataStatus } from '@vedasphere/shared';
import { CloudSun, RefreshCw, AlertTriangle, ShieldCheck, Database, Info } from 'lucide-react';

interface DataCardProps {
  title: string;
  data: NormalizedResult<WeatherData> | null | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

function getRelativeTimeString(updatedAtIso: string): string {
  try {
    const updatedTime = new Date(updatedAtIso).getTime();
    const now = Date.now();
    const diffSeconds = Math.max(0, Math.floor((now - updatedTime) / 1000));

    if (diffSeconds < 60) {
      return 'Updated just now';
    }
    const diffMins = Math.floor(diffSeconds / 60);
    if (diffMins < 60) {
      return `Updated ${diffMins} min ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    return `Updated ${diffHours} h ago`;
  } catch {
    return 'Updated recently';
  }
}

function StatusBadge({ status }: { status: DataStatus }) {
  switch (status) {
    case 'fresh':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Fresh
        </span>
      );
    case 'stale':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Stale
        </span>
      );
    case 'demo':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <Database className="w-3 h-3 text-slate-500" />
          Demo Sample
        </span>
      );
  }
}

export function DataCard({ title, data, isLoading, isError, errorMessage }: DataCardProps) {
  const [, setTick] = useState(0);

  // Live-update relative timestamp every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-surface-2 rounded w-24"></div>
          <div className="h-5 bg-surface-2 rounded-full w-16"></div>
        </div>
        <div className="h-10 bg-surface-2 rounded w-32 mb-4"></div>
        <div className="h-4 bg-surface-2 rounded w-full mb-2"></div>
        <div className="h-4 bg-surface-2 rounded w-3/4"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">{title}</h3>
          <StatusBadge status="demo" />
        </div>
        <div className="py-4 text-center">
          <Info className="w-8 h-8 text-brand-indigo mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium text-ink">
            {errorMessage || "Weather data temporarily unavailable for this location."}
          </p>
          <p className="text-xs text-muted mt-1">Please try searching another city or refresh.</p>
        </div>
      </div>
    );
  }

  const weather = data.data;
  const relativeTime = getRelativeTimeString(data.updatedAt);

  return (
    <div className="bg-surface border border-border rounded-card p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-brand-indigo" />
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">{title}</h3>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Main Temperature & Conditions */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-4xl font-extrabold text-ink tracking-tight tabular-nums">
            {weather.temperatureC}°C
          </span>
          <span className="ml-3 text-sm font-medium text-muted">{weather.conditionLabel}</span>
        </div>
        <div className="text-right text-xs font-semibold text-muted bg-surface-2 px-3 py-1.5 rounded-lg border border-border">
          <span>Max {weather.todayMaxC}°C</span>
          <span className="mx-1">•</span>
          <span>Rain {weather.rainChancePercent}%</span>
        </div>
      </div>



      {/* Footer Attribution & Timestamp */}
      <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border">
        <span>Source: {data.source.name}</span>
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-muted opacity-70" />
          {relativeTime}
        </span>
      </div>
    </div>
  );
}
