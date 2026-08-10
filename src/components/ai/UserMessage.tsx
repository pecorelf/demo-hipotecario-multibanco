import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kicker } from '@/components/ui/Kicker';

interface UserMessageProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function UserMessage({ children, label = 'Tú', className }: UserMessageProps) {
  return (
    <article className={cn('flex flex-col gap-2 max-w-measure ml-auto items-end', className)}>
      <Kicker tone="muted">{label}</Kicker>
      <div className="text-body text-text-secondary leading-relaxed text-right">
        {children}
      </div>
    </article>
  );
}
