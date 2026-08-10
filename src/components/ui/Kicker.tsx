import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type KickerTone = 'accent' | 'muted' | 'inverse';

interface KickerProps {
  children: ReactNode;
  tone?: KickerTone;
  as?: ElementType;
  className?: string;
}

const toneClass: Record<KickerTone, string> = {
  accent: 'text-accent-muted',
  muted: 'text-text-muted',
  inverse: 'text-text-inverse/80',
};

export function Kicker({
  children,
  tone = 'accent',
  as: Tag = 'span',
  className,
}: KickerProps) {
  return (
    <Tag className={cn('text-kicker uppercase', toneClass[tone], className)}>
      {children}
    </Tag>
  );
}
