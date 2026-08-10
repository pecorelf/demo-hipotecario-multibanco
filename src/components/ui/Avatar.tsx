import { cn } from '@/lib/cn';

type AvatarSize = 'xs' | 'sm' | 'base' | 'lg';
type AvatarTone = 'neutral' | 'accent';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  xs: 'w-7 h-7 text-[11px]',
  sm: 'w-9 h-9 text-[13px]',
  base: 'w-11 h-11 text-body-sm',
  lg: 'w-14 h-14 text-body',
};

const toneClass: Record<AvatarTone, string> = {
  neutral: 'bg-bg-sunken text-text-secondary',
  accent: 'bg-accent text-text-inverse',
};

function initialsFrom(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name, size = 'base', tone = 'neutral', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium tracking-wider',
        sizeClass[size],
        toneClass[tone],
        className,
      )}
      aria-label={name}
    >
      {initialsFrom(name)}
    </span>
  );
}
