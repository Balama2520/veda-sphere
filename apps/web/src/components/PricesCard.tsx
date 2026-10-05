import React from 'react';
import { NormalizedResult, PricesData } from '@vedasphere/shared';

interface PricesCardProps {
  data?: NormalizedResult<PricesData>;
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

export function PricesCard({ data, isLoading, isError, errorMessage }: PricesCardProps) {
  if (isLoading) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card border border-border animate-pulse space-y-3">
        <div className="h-5 w-32 bg-surface-2 rounded" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 bg-surface-2 rounded" />
          <div className="h-16 bg-surface-2 rounded" />
          <div className="h-16 bg-surface-2 rounded" />
          <div className="h-16 bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-surface rounded-card p-5 shadow-card border border-border">
        <h3 className="font-semibold text-ink text-base mb-2">City & Market Prices</h3>
        <p className="text-sm text-status-warning font-medium">
          {errorMessage || 'Unable to load prices at this moment.'}
        </p>
      </div>
    );
  }

  const { currency, fuel, preciousMetals, marketIndex } = data.data;
  const cardStatus = data.status;

  const statusColors = {
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stale: 'bg-amber-50 text-amber-700 border-amber-200',
    demo: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="bg-surface rounded-card p-5 shadow-card border border-border transition-all">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="font-semibold text-ink text-base">Key Rates &amp; Prices</h3>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
            statusColors[cardStatus] || statusColors.fresh
          }`}
        >
          {cardStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* USD to INR (Real reference rate from ECB/Frankfurter) */}
        <div className="bg-surface-2 rounded-btn p-3 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">USD / INR</span>
            {currency.status === 'demo' ? (
              <span className="text-[10px] uppercase bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                Sample
              </span>
            ) : (
              <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                Ref Rate
              </span>
            )}
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold ${
                currency.status === 'demo' ? 'text-slate-500 font-mono' : 'text-ink'
              }`}
            >
              ₹{currency.usdInr.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-muted line-clamp-1">
            Date: {currency.rateDate} (ECB)
          </div>
        </div>

        {/* Petrol */}
        <div className="bg-surface-2 rounded-btn p-3 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Petrol</span>
            {fuel.isSample && (
              <span className="text-[10px] uppercase bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                Sample
              </span>
            )}
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold ${
                fuel.isSample ? 'text-slate-500 font-mono italic' : 'text-ink'
              }`}
            >
              ₹{fuel.petrolPerLitre.toFixed(2)}
            </span>
            <span className="text-xs text-muted ml-1">/ L</span>
          </div>
          <div className="text-[11px] text-muted truncate">{fuel.note}</div>
        </div>

        {/* Gold 24K */}
        <div className="bg-surface-2 rounded-btn p-3 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Gold 24K</span>
            {preciousMetals.isSample && (
              <span className="text-[10px] uppercase bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                Sample
              </span>
            )}
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold ${
                preciousMetals.isSample ? 'text-slate-500 font-mono italic' : 'text-ink'
              }`}
            >
              ₹{preciousMetals.gold24kPer10g.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-muted ml-1">/ 10g</span>
          </div>
          <div className="text-[11px] text-muted truncate">{preciousMetals.note}</div>
        </div>

        {/* Nifty 50 */}
        <div className="bg-surface-2 rounded-btn p-3 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Nifty 50</span>
            <div className="flex items-center gap-1">
              {marketIndex.isDelayed && (
                <span className="text-[10px] uppercase bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                  Delayed
                </span>
              )}
              {marketIndex.isSample && (
                <span className="text-[10px] uppercase bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                  Sample
                </span>
              )}
            </div>
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold ${
                marketIndex.isSample ? 'text-slate-500 font-mono italic' : 'text-ink'
              }`}
            >
              {marketIndex.nifty50.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-muted truncate">NSE Index</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-end text-xs text-muted">
        <span>Updated {getRelativeTimeString(data.updatedAt)}</span>
      </div>
    </div>
  );
}
