'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, List, Building2,
  DollarSign, Bot, Bell, Settings,
  TrendingUp, ChevronLeft, ChevronRight,
  Sparkles, ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type NavItem = { href: string; icon: React.ElementType; label: string };
type NavGroup = { label?: string; items: NavItem[] };

// Each group = one mindset:
// (top) daily home · review performance · manage capital · choose next firm
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/overview', icon: LayoutDashboard, label: 'Home' },
    ],
  },
  {
    label: 'Trading',
    items: [
      { href: '/trades',    icon: List,      label: 'Trades' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'My Accounts',
    items: [
      { href: '/accounts', icon: Building2,  label: 'Accounts' },
      { href: '/payouts',  icon: DollarSign, label: 'Payouts & ROI' },
    ],
  },
  {
    label: 'Firm Hub',
    items: [
      { href: '/firms',              icon: Building2,  label: 'Explore Firms' },
      { href: '/recommendations',    icon: Sparkles,   label: 'Recommendations' },
      { href: '/firms/rule-monitor', icon: ShieldAlert, label: 'Rule Monitor' },
    ],
  },
];

// Utility items pinned to the footer
const FOOTER_ITEMS: NavItem[] = [
  { href: '/ai-coach', icon: Bot,      label: 'AI Coach' },
  { href: '/alerts',   icon: Bell,     label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/firms') {
    // Explore Firms owns /firms and firm profiles, but not rule-monitor
    return (pathname === '/firms' || pathname.startsWith('/firms/'))
      && !pathname.startsWith('/firms/rule-monitor');
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderItem = ({ href, icon: Icon, label }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-[var(--primary)] text-black'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
          collapsed && 'justify-center',
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && label}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] shrink-0">
          <TrendingUp className="w-4 h-4 text-black" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Prop<span className="text-[var(--primary)]">OS</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? gi}>
            {!collapsed && group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] opacity-50">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(renderItem)}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer utilities */}
      <div className="border-t border-[var(--border)] px-2 py-3 space-y-0.5">
        {FOOTER_ITEMS.map(renderItem)}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
