'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CloudSun,
  Newspaper,
  TrendingUp,
  MessageCircleQuestion,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',        label: 'Brief',   Icon: LayoutDashboard },
  { href: '/weather', label: 'Weather', Icon: CloudSun },
  { href: '/news',    label: 'News',    Icon: Newspaper },
  { href: '/prices',  label: 'Prices',  Icon: TrendingUp },
  { href: '/ask',     label: 'Ask',     Icon: MessageCircleQuestion },
];

function NavLink({ href, label, Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`
        flex flex-col items-center justify-center gap-0.5
        lg:flex-row lg:gap-3 lg:justify-start lg:px-4 lg:py-3 lg:rounded-btn
        text-xs font-medium transition-all duration-150 group
        ${isActive
          ? 'text-brand lg:bg-brand/10'
          : 'text-muted hover:text-ink lg:hover:bg-surface-2'
        }
      `}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${
          isActive ? 'text-brand' : 'text-muted group-hover:text-ink'
        }`}
      />
      <span className="leading-none lg:text-sm">{label}</span>
    </Link>
  );
}

/**
 * NavRail renders:
 *   - mobile: fixed bottom tab bar (z-50, height=64px)
 *   - desktop (lg+): fixed left sidebar (width=220px)
 * Body padding is pre-allocated in globals.css.
 */
export function NavRail() {
  return (
    <>
      {/* ── Mobile: bottom tab bar ─────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="
          lg:hidden
          fixed bottom-0 left-0 right-0 z-50
          h-[64px] px-2
          bg-surface/95 backdrop-blur-md
          border-t border-border
          flex items-center justify-around
          safe-area-inset-bottom
        "
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* ── Desktop: left sidebar ──────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="
          hidden lg:flex
          fixed top-0 left-0 bottom-0 z-40
          w-[220px] px-3 py-6
          bg-surface border-r border-border
          flex-col gap-1
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-2 mb-6">
          <span className="text-2xl select-none" aria-hidden>🌌</span>
          <span className="font-bold text-ink text-lg tracking-tight">VedaSphere</span>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </>
  );
}
