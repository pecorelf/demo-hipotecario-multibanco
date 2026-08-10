import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kicker } from './Kicker';
import { Button } from './Button';

interface Action {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: Action;
  className?: string;
}

export function EmptyState({
  kicker,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-start gap-4 py-16 px-8 max-w-measure', className)}>
      <span aria-hidden className="block w-12 h-px bg-border-hairline" />
      {kicker && <Kicker tone="muted">{kicker}</Kicker>}
      <h3 className="text-h2 text-text-primary">{title}</h3>
      {description && <p className="text-body text-text-secondary">{description}</p>}
      {action && (
        <div className="mt-2">
          <Button variant="secondary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
