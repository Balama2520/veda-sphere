'use client';

import React from 'react';
import { MessageCircleQuestion } from 'lucide-react';

export default function AskPage() {
  return (
    <main aria-labelledby="ask-heading" className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-6">
        <MessageCircleQuestion className="w-8 h-8 text-brand" />
      </div>

      <h1
        id="ask-heading"
        className="text-2xl font-bold text-ink mb-3 tracking-tight"
      >
        Ask VedaSphere
      </h1>

      <p className="text-muted text-sm max-w-xs leading-relaxed mb-6">
        Natural-language Q&amp;A about your city — weather, air quality, and
        local prices — is coming soon.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-btn text-xs font-medium text-muted">
        <span className="w-2 h-2 rounded-full bg-accent-saffron animate-pulse" />
        Coming in Phase 6
      </div>
    </main>
  );
}
