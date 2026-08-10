import type { ReactNode } from 'react';
import { EmptyState, Kicker, PageTitle } from '@/components/ui';

interface PagePlaceholderProps {
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  module: string;
  cases: string;
}

export function PagePlaceholder({
  kicker,
  title,
  subtitle,
  module,
  cases,
}: PagePlaceholderProps) {
  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12">
      <header className="max-w-measure">
        <Kicker>{kicker}</Kicker>
        <PageTitle className="mt-3">{title}</PageTitle>
        {subtitle && (
          <p className="text-body-lg text-text-secondary mt-3">{subtitle}</p>
        )}
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      <EmptyState
        kicker={`Pendiente · ${module}`}
        title="Esta pantalla se construye en un módulo posterior."
        description={`Cubrirá los casos: ${cases}. Por ahora estamos en el bootstrap (Módulo 0) — el design system, el shell y el switch de rol ya están funcionando.`}
        className="mt-12"
      />
    </div>
  );
}
