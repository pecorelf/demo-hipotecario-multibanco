import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Kicker } from '@/components/ui/Kicker';

interface AiMessageProps {
  children: ReactNode;
  label?: string;
  streaming?: boolean;
  className?: string;
}

export function AiMessage({
  children,
  label = 'Asistente',
  streaming = false,
  className,
}: AiMessageProps) {
  return (
    <article className={cn('flex gap-4 max-w-measure animate-fade-in', className)}>
      <span
        aria-hidden
        className="mt-[2px] w-[2px] bg-accent shrink-0 self-stretch"
      />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <Kicker>{label}</Kicker>
        <div
          className={cn(
            'text-body text-text-primary leading-relaxed',
            streaming && 'min-h-[1.5em]',
          )}
        >
          {children}
        </div>
      </div>
    </article>
  );
}
