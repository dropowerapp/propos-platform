'use client';

import { Search } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { NotificationInbox } from './notification-inbox';

export function Topbar() {
  const { user, isLoaded } = useUser();

  const displayName = user?.fullName ?? user?.emailAddresses[0]?.emailAddress ?? '';

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search trades, firms, journal..."
          className="pl-9 pr-4 py-1.5 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] w-72"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Plan badge */}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--primary)] text-[var(--primary)]">
          Pro
        </span>

        {/* Unified notification inbox: risk + rule changes + payouts */}
        <NotificationInbox />

        {/* Clerk UserButton — avatar + sign-out dropdown (shows skeleton while loading) */}
        {isLoaded && (
          <div className="flex items-center gap-2 pl-1">
            {displayName && (
              <span className="text-sm font-medium text-[var(--foreground)] hidden sm:block">
                {displayName}
              </span>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7',
                },
              }}
            />
          </div>
        )}
        {!isLoaded && (
          <div className="w-7 h-7 rounded-full bg-[var(--secondary)] animate-pulse" />
        )}
      </div>
    </header>
  );
}
