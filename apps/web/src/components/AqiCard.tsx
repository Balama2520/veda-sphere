'use client';

import React, { useState, useEffect } from 'react';
import { NormalizedResult, AqiData, DataStatus, AqiCategory } from '@vedasphere/shared';
import { Wind, RefreshCw, AlertTriangle, ShieldCheck, Database, Info } from 'lucide-react';

function getRelativeTimeString(iso: string): string {
  try {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diff < 60) return 'Updated just now';
    const m = Math.floor(diff / 60);
    if (m < 60) return `Updated ${m} min ago`;
    return `Updated ${Math.floor(m / 60)} h ago`;
  } catch { return 'Updated recently'; }
}

const AQI_BAND_STYLES: Record<AqiCategory, { bg: string; text: string; border: string }> = {
  'Good':       { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Satisfactory': { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-300' },
  'Moderate':   { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Poor':       { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300' },
  'Very Poor':  { bg: 'bg-red-50',    text: 'text-red-800',    border: 'border-red-300' },
  'Severe':     { bg: 'bg-rose-100',  text: 'text-rose-900',   border: 'border-rose-400' },
};

function StatusBadge({ status }: { status: DataStatus }) {
  if (status === 'fresh') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <ShieldCheck className="w-3 h-3" /> Fresh
    </span>
  );
  if (status === 'stale') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" /> Stale
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
      <Database className="w-3 h-3" /> Demo
    </span>
  );
}

interface AqiCardProps {
  data: NormalizedResult<AqiData> | null | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

export function AqiCard({ data, isLoading, isError, errorMessage }: AqiCardProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-surface-2 rounded w-24"></div>
          <div className="h-5 bg-surface-2 rounded-full w-16"></div>
        </div>
        <div className="h-10 bg-surface-2 rounded w-24 mb-3"></div>
        <div className="h-4 bg-surface-2 rounded w-full mb-2"></div>
        <div className="h-4 bg-surface-2 rounded w-2/3"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface border border-border rounded-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
            <Wind className="w-4 h-4 text-brand-indigo" /> Air Quality Index
          </h3>
          <StatusBadge status="demo" />
        </div>
        <div className="py-4 text-center">
          <Info className="w-8 h-8 text-brand-indigo mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium text-ink">{errorMessage || 'Air quality data temporarily unavailable.'}</p>
        </div>
      </div>
    );
  }

  const aqi = data.data;
  const bandStyle = AQI_BAND_STYLES[aqi.category];
  const relTime = getRelativeTimeString(data.updatedAt);

  return (
    <div className="bg-surface border border-border rounded-card p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-brand-indigo" />
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Air Quality Index</h3>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* AQI Number + Category Chip */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl font-extrabold text-ink tabular-nums">{aqi.aqi}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${bandStyle.bg} ${bandStyle.text} ${bandStyle.border}`}>
          {aqi.category}
        </span>
      </div>

      {/* Meta: dominant pollutant + basis */}
      <div className="flex items-center gap-3 text-xs text-muted mb-3">
        <span>Dominant: <strong className="text-ink">{aqi.dominantPollutant}</strong></span>
        <span>•</span>
        <span>{aqi.basis === '24h-average' ? '24-hour average' : 'Latest hour'}</span>
      </div>


      {/* Footer */}
      <div className="border-t border-border pt-3 space-y-1">
        <p className="text-xs text-muted italic">{aqi.userNote}</p>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Source: {data.source.name}</span>
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 opacity-70" /> {relTime}
          </span>
        </div>
      </div>
    </div>
  );
}
