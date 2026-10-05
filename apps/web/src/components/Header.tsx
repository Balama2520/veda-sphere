import React from 'react';

export function Header() {
  return (
    <header className="py-4 flex items-center justify-between border-b border-border mb-6">
      <div className="flex items-center space-x-2">
        <svg
          className="w-7 h-7 text-brand-indigo"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
          <path d="M3.6 9h16.8" />
          <path d="M3.6 15h16.8" />
        </svg>
        <span className="text-xl font-bold tracking-tight text-brand-indigo">
          VedaSphere
        </span>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 bg-surface-2 text-muted rounded-full border border-border">
        Daily City Brief
      </span>
    </header>
  );
}
