import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  className,
  wrapperClassName,
  id: idProp,
  ...rest
}: InputProps) {
  const reactId = useId();
  const id = idProp ?? reactId;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-body-sm text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center bg-bg-card border transition-all duration-base ease-out-soft',
          error ? 'border-status-error' : 'border-border-hairline',
          'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15',
          wrapperClassName,
        )}
      >
        {prefix && <span className="pl-4 text-text-muted text-body-sm">{prefix}</span>}
        <input
          id={id}
          className={cn(
            'flex-1 bg-transparent px-4 py-3 text-body text-text-primary placeholder:text-text-muted focus:outline-none',
            className,
          )}
          {...rest}
        />
        {suffix && <span className="pr-4 text-text-muted text-body-sm">{suffix}</span>}
      </div>
      {(hint || error) && (
        <span className={cn('text-caption', error ? 'text-status-error' : 'text-text-muted')}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
