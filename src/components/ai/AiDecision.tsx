import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Kicker } from '@/components/ui/Kicker';

interface AiDecisionProps {
  verdict: ReactNode;
  summary: ReactNode;
  reasoning: ReactNode[];
  sources?: ReactNode[];
  defaultOpen?: boolean;
  className?: string;
}

export function AiDecision({
  verdict,
  summary,
  reasoning,
  sources,
  defaultOpen = false,
  className,
}: AiDecisionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-border-hairline bg-bg-card', className)}>
      <div className="p-6">
        <Kicker className="block mb-2">Decisión del asistente</Kicker>
        <div className="text-h3 text-text-primary mb-3">{verdict}</div>
        <p className="text-body text-text-secondary max-w-measure">{summary}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 border-t border-border-hairline text-body-sm text-accent-muted hover:bg-bg-sunken transition-colors duration-base ease-out-soft"
        aria-expanded={open}
      >
        <span className="font-medium">
          {open ? 'Ocultar razonamiento' : 'Ver razonamiento'}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-base ease-out-soft',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="bg-bg-sunken px-6 py-6 border-t border-border-hairline animate-fade-in">
          <ol className="space-y-4">
            {reasoning.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="text-body-sm text-text-secondary">{step}</div>
              </li>
            ))}
          </ol>
          {sources && sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border-hairline">
              <Kicker tone="muted" className="block mb-3">
                Fuentes
              </Kicker>
              <ul className="space-y-1.5">
                {sources.map((src, idx) => (
                  <li key={idx} className="text-body-sm text-text-secondary">
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
