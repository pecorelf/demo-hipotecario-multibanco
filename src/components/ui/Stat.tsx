import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kicker } from './Kicker';

type StatSize = 'base' | 'lg';
type DeltaDirection = 'up' | 'down' | 'flat';

interface Delta {
  direction: DeltaDirection;
  value: string;
}

interface StatProps {
  value: ReactNode;
  label: ReactNode;
  delta?: Delta;
  hint?: ReactNode;
  size?: StatSize;
  className?: string;
}

const valueClass: Record<StatSize, string> = {
  base: 'text-stat-lg',
  lg: 'text-stat-xl',
};

const deltaColor: Record<DeltaDirection, string> = {
  up: 'text-status-success',
  down: 'text-status-error',
  flat: 'text-text-muted',
};

export function Stat({ value, label, delta, hint, size = 'base', className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Kicker tone="muted">{label}</Kicker>
      <div className="flex items-baseline gap-3">
        <span className={cn(valueClass[size], 'text-text-primary font-sans tabular-nums')}>
          {value}
        </span>
        {delta && (
          <span className={cn('text-body-sm font-medium tabular-nums', deltaColor[delta.direction])}>
            {delta.value}
          </span>
        )}
      </div>
      {hint && <span className="text-caption text-text-muted">{hint}</span>}
    </div>
  );
}
