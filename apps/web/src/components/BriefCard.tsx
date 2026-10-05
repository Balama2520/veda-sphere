'use client';

import React from 'react';
import { BriefLine, AdviceSeverity, DataStatus } from '@vedasphere/shared';
import { Umbrella, Wind, Sun, CloudOff, AlertTriangle, Info, ShieldAlert, ShieldCheck, Database } from 'lucide-react';

function getLineIcon(icon: string) {
  const cls = 'w-5 h-5 flex-shrink-0';
  switch (icon) {
    case 'umbrella': return <Umbrella className={cls} />;
    case 'wind':     return <Wind className={cls} />;
    case 'sun':      return <Sun className={cls} />;
    default:         return <CloudOff className={cls} />;
  }
}

function SeverityChip({ severity }: { severity: AdviceSeverity }) {
  if (severity === 'warning') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <ShieldAlert className="w-3 h-3" /> Warning
    </span>
  );
  if (severity === 'caution') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle className="w-3 h-3" /> Caution
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <Info className="w-3 h-3" /> Info
    </span>
  );
}

function NonFreshBadge({ status }: { status: DataStatus }) {
  if (status === 'stale') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
      <AlertTriangle className="w-2.5 h-2.5" /> Stale
    </span>
  );
  if (status === 'demo') return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      <Database className="w-2.5 h-2.5" /> Demo
    </span>
  );
  return null;
}

interface BriefCardProps {
  city: string;
  lines: BriefLine[];
  overallStatus: DataStatus;
  generatedAt: string;
  isLoading: boolean;
}

export function BriefCard({ city, lines, overallStatus, generatedAt, isLoading }: BriefCardProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-card p-6 shadow-sm mb-4 animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-32 mb-4"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="w-5 h-5 bg-surface-2 rounded-full flex-shrink-0"></div>
            <div className="h-4 bg-surface-2 rounded flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-accent-saffron/30 rounded-card p-5 shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShieldCheck className="w-4 h-4 text-accent-saffron" />
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Today in {city}</h2>
          </div>
          <p className="text-xs text-muted">
            {new Date(generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {overallStatus !== 'fresh' && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {overallStatus === 'stale' ? '⚠ Some data is stale' : '⚠ Demo data'}
          </span>
        )}
      </div>

      {/* Lines */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="flex items-start gap-3">
            <div className="mt-0.5 text-brand">{getLineIcon(line.icon)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink leading-snug">{line.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <SeverityChip severity={line.severity} />
                <NonFreshBadge status={line.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
