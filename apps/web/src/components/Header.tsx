'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useCity } from '../context/CityContext';
import { CitySheet } from './CitySheet';
import { Sun, Moon, Monitor, MapPin, ChevronDown } from 'lucide-react';

export function Header() {
  const { city } = useCity();
  const { theme, setTheme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const cityChipRef = useRef<HTMLButtonElement | null>(null);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  return (
    <header
      className="
        sticky top-0 z-40
        bg-surface/95 backdrop-blur-md
        border-b border-border
        px-4 py-3 mb-2
        flex items-center justify-between
        lg:pl-[calc(var(--nav-sidebar-w)+1rem)]
      "
    >
      {/* Mobile brand mark (hidden on desktop — sidebar has the logo) */}
      <div className="flex items-center gap-2 lg:hidden" aria-hidden>
        <span className="text-xl select-none">🌌</span>
        <span className="font-bold text-ink text-base tracking-tight">VedaSphere</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* City Chip */}
        <button
          ref={cityChipRef}
          id="city-selector-trigger"
          onClick={() => setIsSheetOpen(true)}
          className="
            flex items-center gap-1.5
            px-3 py-1.5
            bg-surface-2 hover:bg-border/60
            border border-border rounded-full
            text-xs font-semibold text-ink
            transition-colors min-h-[36px]
          "
          aria-label={`Current city: ${city}. Tap to change.`}
          aria-haspopup="dialog"
          aria-expanded={isSheetOpen}
        >
          <MapPin className="w-3.5 h-3.5 text-brand" aria-hidden />
          <span>{city}</span>
          <ChevronDown className="w-3 h-3 text-muted" aria-hidden />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="
            p-2
            bg-surface-2 hover:bg-border/60
            border border-border rounded-full
            text-ink transition-colors
            min-h-[36px] min-w-[36px]
            flex items-center justify-center
          "
          aria-label={`Theme: ${themeLabel}. Click to cycle.`}
          title={`Theme: ${themeLabel}`}
        >
          <ThemeIcon className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <CitySheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        triggerRef={cityChipRef}
      />
    </header>
  );
}
