import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Pill } from '@/components/ui/Pill';
import type { PillVariant } from '@/components/ui/Pill';

type InsightVariant = Exclude<PillVariant, 'neutral'>;

interface AiInsightProps {
  variant?: InsightVariant;
  message: ReactNode;
  detailLabel?: string;
  onDetail?: () => void;
  className?: string;
}

const variantLabel: Record<InsightVariant, string> = {
  warning: 'Inconsistencia',
  info: 'Observación',
  error: 'Alerta',
  success: 'Validado',
};

export function AiInsight({
  variant = 'warning',
  message,
  detailLabel = 'Ver detalle',
  onDetail,
  className,
}: AiInsightProps) {
  return (
    <div className={cn('flex items-start gap-4 py-3', className)}>
      <Pill variant={variant} size="sm" className="mt-0.5 shrink-0">
        {variantLabel[variant]}
      </Pill>
      <p className="text-body-sm text-text-secondary flex-1">
        {message}
        {onDetail && (
          <>
            {' '}
            <button
              type="button"
              onClick={onDetail}
              className="text-accent-muted hover:text-accent underline underline-offset-4 transition-colors duration-base"
            >
              {detailLabel}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
