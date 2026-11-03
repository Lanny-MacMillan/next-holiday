'use client';

import { useEffect, useRef, useState } from 'react';
import { useGetUserProgressQuery } from '@/store/api';
import { newBadgeNames, snapshotOf, type ProgressSnapshot } from '@/lib/badgeNotice';

const SHOW_MS = 6000;

export default function BadgeEarnedNotice() {
  const { data } = useGetUserProgressQuery();
  const seen = useRef<ProgressSnapshot | null>(null);
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    if (seen.current) {
      const fresh = newBadgeNames(seen.current, data);
      if (fresh.length > 0) setNames(fresh);
    }
    seen.current = snapshotOf(data);
  }, [data]);

  useEffect(() => {
    if (names.length === 0) return;
    const timer = setTimeout(() => setNames([]), SHOW_MS);
    return () => clearTimeout(timer);
  }, [names]);

  if (names.length === 0) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[9999] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-lg bg-emerald-800 px-4 py-3 text-white shadow-xl"
    >
      <p className="flex-1 text-sm font-medium">
        {names.length === 1 ? 'Badge earned: ' : 'Badges earned: '}
        {names.join(', ')}
      </p>
      <button
        type="button"
        onClick={() => setNames([])}
        aria-label="Dismiss"
        className="text-sm font-semibold underline"
      >
        Dismiss
      </button>
    </div>
  );
}
