'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, GitCompare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared tab bar for the Firm Hub — one destination, three views.
const HUB_TABS = [
  { href: '/firms',         label: 'Directory', icon: Building2 },
  { href: '/firms/compare', label: 'Compare',   icon: GitCompare },
  { href: '/firms/reviews', label: 'Reviews',   icon: Star },
];

export function FirmHubTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-0 border-b border-[var(--border)]">
      {HUB_TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/firms'
          ? pathname === '/firms' || (pathname.startsWith('/firms/') && !pathname.startsWith('/firms/compare') && !pathname.startsWith('/firms/reviews') && !pathname.startsWith('/firms/rule-monitor'))
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              active
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
