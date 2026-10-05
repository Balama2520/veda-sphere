'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCity, QUICK_CITY_CHIPS } from '../context/CityContext';
import { CityItem } from '@vedasphere/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function CitySheet({ isOpen, onClose, triggerRef }: CitySheetProps) {
  const { city: activeCity, setCity, recentCities } = useCity();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger button on close
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  // Debounced search (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/cities/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as CityItem[];
        setResults(data.slice(0, 5));
      } catch {
        setSearchError('Unable to search cities right now.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (cityName: string) => {
    setCity(cityName);
    setQuery('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Select City"
    >
      <div
        ref={modalRef}
        className="w-full sm:max-w-md bg-surface border border-border rounded-t-card sm:rounded-card p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-semibold text-ink text-base">Select Your City</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-ink rounded-lg hover:bg-surface-2 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close sheet"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Indian cities (e.g. Pune, Jaipur)..."
            className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-btn text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand text-sm"
          />
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="text-xs text-muted py-2 flex items-center gap-2">
            <span className="animate-spin">⏳</span> Searching...
          </div>
        )}

        {searchError && <div className="text-xs text-status-warning py-1">{searchError}</div>}

        {results.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Search Results</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={`${r.name}-${r.latitude}`}
                  onClick={() => handleSelect(r.name)}
                  className="w-full text-left px-3 py-2 rounded-btn hover:bg-surface-2 text-ink text-sm flex items-center justify-between transition-colors"
                >
                  <span className="font-medium">{r.name}</span>
                  {r.state && <span className="text-xs text-muted">{r.state}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Cities */}
        {recentCities.length > 0 && query.trim().length < 2 && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Recent Cities</p>
            <div className="flex flex-wrap gap-2">
              {recentCities.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSelect(c)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${
                    c.toLowerCase() === activeCity.toLowerCase()
                      ? 'bg-brand text-white border-brand'
                      : 'bg-surface-2 text-ink border-border hover:bg-border/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Chips */}
        {query.trim().length < 2 && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Major Cities</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_CITY_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleSelect(c)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${
                    c.toLowerCase() === activeCity.toLowerCase()
                      ? 'bg-brand text-white border-brand'
                      : 'bg-surface-2 text-ink border-border hover:bg-border/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
