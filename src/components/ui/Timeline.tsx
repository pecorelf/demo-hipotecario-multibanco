import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kicker } from './Kicker';

export type TimelineState = 'done' | 'current' | 'pending';

export interface TimelineItem {
  timestamp: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  state?: TimelineState;
  children?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotClass: Record<TimelineState, string> = {
  done: 'bg-text-primary',
  current: 'bg-accent ring-4 ring-accent/15',
  pending: 'bg-bg-card border border-border-hairline',
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative', className)}>
      <span
        aria-hidden
        className="absolute left-[3.5px] top-2 bottom-2 w-px bg-border-hairline"
      />
      {items.map((item, idx) => {
        const state = item.state ?? 'pending';
        return (
          <li key={idx} className="relative pl-8 pb-10 last:pb-0">
            <span
              aria-hidden
              className={cn('absolute left-0 top-[6px] w-2 h-2 rounded-full', dotClass[state])}
            />
            {item.timestamp && (
              <Kicker tone="muted" className="block mb-1">
                {item.timestamp}
              </Kicker>
            )}
            <div className="text-body text-text-primary">{item.title}</div>
            {item.detail && (
              <div className="text-body-sm text-text-secondary mt-1">{item.detail}</div>
            )}
            {item.children && <div className="mt-4">{item.children}</div>}
          </li>
        );
      })}
    </ol>
  );
}
