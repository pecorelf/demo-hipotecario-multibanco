import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Step {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
}

interface ProgressStepperProps {
  steps: Step[];
  currentIndex: number;
  className?: string;
}

type StepState = 'done' | 'current' | 'pending';

/**
 * Responsive horizontal stepper.
 *
 * - Mobile (< md / 768px):
 *     Compact view — single line with "Etapa X de N" + current label
 *     + horizontal progress bar. Much more legible than squeezing 7
 *     pills on a 360px screen.
 *
 * - Tablet/Desktop (md+):
 *     Full horizontal stepper with all steps visible. Last step is
 *     flex-none so its label can't push out of the card.
 */
export function ProgressStepper({ steps, currentIndex, className }: ProgressStepperProps) {
  const total = steps.length;
  const current = steps[currentIndex];
  const safeCurrentIdx = Math.min(Math.max(currentIndex, 0), total - 1);
  const progressPct = total > 0 ? ((safeCurrentIdx + 1) / total) * 100 : 0;

  return (
    <div className={cn('w-full', className)}>
      {/* MOBILE — compact (default, hidden at md+) */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-caption uppercase tracking-[0.14em] text-text-muted shrink-0">
              Etapa {safeCurrentIdx + 1} de {total}
            </span>
          </div>
          <span className="text-caption text-text-muted shrink-0 tabular-nums">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div
          className="text-body-sm font-medium text-text-primary mb-3 leading-tight truncate"
          title={typeof current?.label === 'string' ? current.label : undefined}
        >
          {current?.label}
        </div>
        <div className="h-1 bg-border-hairline w-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-base"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* TABLET/DESKTOP — full stepper (hidden by default, visible at md+) */}
      <ol className="hidden md:flex items-stretch w-full">
        {steps.map((step, idx) => {
          const state: StepState =
            idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'pending';
          const isLast = idx === steps.length - 1;
          return (
            <li
              key={step.id ?? idx}
              className={cn(
                'flex flex-col gap-3 relative min-w-0',
                isLast ? 'flex-none' : 'flex-1',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 shrink-0 text-body-sm font-medium border',
                    state === 'done' && 'bg-text-primary text-text-inverse border-text-primary',
                    state === 'current' && 'bg-accent text-text-inverse border-accent',
                    state === 'pending' && 'bg-bg-card text-text-muted border-border-hairline',
                  )}
                >
                  {idx + 1}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      'flex-1 h-px min-w-[12px]',
                      state === 'done' ? 'bg-text-primary' : 'bg-border-hairline',
                    )}
                  />
                )}
              </div>
              <div className={cn(isLast ? '' : 'pr-3', 'min-w-0')}>
                <div
                  className={cn(
                    'text-caption leading-tight break-words',
                    state === 'pending' ? 'text-text-muted' : 'text-text-primary',
                    state === 'current' && 'font-medium',
                  )}
                >
                  {step.label}
                </div>
                {step.hint && (
                  <div className="text-caption text-text-muted mt-0.5 leading-tight">{step.hint}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
