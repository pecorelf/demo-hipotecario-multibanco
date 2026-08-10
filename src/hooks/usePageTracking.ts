import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * usePageTracking — POSTs to /api/track whenever the location changes.
 *
 * Sends:
 *  - current page
 *  - previous page (if any)
 *  - duration on previous page in seconds
 *
 * Fire-and-forget: failures are silent. Tracking shouldn't break UX.
 */
export function usePageTracking() {
  const location = useLocation();
  const prevPageRef = useRef<{ page: string; enteredAt: number } | null>(null);

  useEffect(() => {
    const currentPage = location.pathname;
    const now = Date.now();
    const prev = prevPageRef.current;

    const payload: {
      page: string;
      previousPage?: string;
      previousDurationSec?: number;
    } = { page: currentPage };

    if (prev) {
      payload.previousPage = prev.page;
      payload.previousDurationSec = Math.round((now - prev.enteredAt) / 1000);
    }

    // Fire-and-forget POST
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // We don't await this — tracking is best-effort
    }).catch(() => {
      /* ignore */
    });

    // Update ref for next navigation
    prevPageRef.current = { page: currentPage, enteredAt: now };
  }, [location.pathname]);
}
