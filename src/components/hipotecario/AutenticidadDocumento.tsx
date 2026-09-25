import { AlertTriangle, Check, FileSearch } from 'lucide-react';
import { Kicker, Pill } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Verificación de autenticidad de un documento.
 *
 * No revisa si el documento es el correcto, sino si es legítimo: metadatos
 * coherentes, montos que cuadran entre sí y cruce con movimientos que el
 * banco ya tiene. Es la conversación que abre el proceso hipotecario con
 * Riesgo y con Prevención de Fraude, que normalmente no están en esta mesa.
 */

export interface ChequeoAutenticidad {
  nombre: string;
  resultado: 'ok' | 'alerta';
  detalle: string;
}

export const CHEQUEOS_LIQUIDACION: ChequeoAutenticidad[] = [
  { nombre: 'Origen del archivo', resultado: 'ok', detalle: 'Generado por un sistema de remuneraciones, no editado en un procesador de texto.' },
  { nombre: 'Coherencia de metadatos', resultado: 'ok', detalle: 'Fecha de creación del archivo consistente con el período declarado.' },
  { nombre: 'Cuadratura interna', resultado: 'ok', detalle: 'Haberes menos descuentos coincide con el líquido informado.' },
  { nombre: 'Cruce con cuenta corriente', resultado: 'alerta', detalle: 'El depósito de agosto es $ 62.000 mayor al líquido de la liquidación. Podría ser un bono no declarado.' },
  { nombre: 'Continuidad de cotizaciones', resultado: 'ok', detalle: 'Previred registra los mismos períodos sin lagunas.' },
];

export function AutenticidadDocumento({
  documento,
  chequeos = CHEQUEOS_LIQUIDACION,
  className,
}: {
  documento: string;
  chequeos?: ChequeoAutenticidad[];
  className?: string;
}) {
  const alertas = chequeos.filter((c) => c.resultado === 'alerta').length;
  const confianza = Math.round(((chequeos.length - alertas) / chequeos.length) * 100);

  return (
    <section className={cn('rounded-xl border border-border-hairline bg-bg-card shadow-soft px-6 py-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <FileSearch size={18} className="text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <Kicker tone="muted">Verificación de autenticidad</Kicker>
            <h3 className="text-body font-semibold text-text-primary mt-1.5">{documento}</h3>
          </div>
        </div>
        {alertas > 0 ? (
          <Pill variant="warning">{alertas} punto por revisar</Pill>
        ) : (
          <Pill variant="success">Sin observaciones</Pill>
        )}
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span
          className={cn(
            'text-2xl font-semibold tabular-nums leading-none',
            alertas > 0 ? 'text-status-warning' : 'text-status-success',
          )}
        >
          {confianza}%
        </span>
        <span className="text-body-sm text-text-secondary">de confianza documental</span>
      </div>

      <div className="mt-5 divide-y divide-border-hairline border-t border-border-hairline">
        {chequeos.map((c) => (
          <div key={c.nombre} className="py-3 flex items-start gap-3">
            <span className="mt-0.5 shrink-0">
              {c.resultado === 'ok' ? (
                <Check size={14} className="text-status-success" />
              ) : (
                <AlertTriangle size={14} className="text-status-warning" />
              )}
            </span>
            <div className="min-w-0">
              <span className="text-body-sm text-text-primary">{c.nombre}</span>
              <p className="text-caption text-text-muted mt-0.5">{c.detalle}</p>
            </div>
          </div>
        ))}
      </div>

      {alertas > 0 && (
        <p className="text-caption text-text-secondary mt-4">
          La alerta no bloquea la operación: se deja registrada y el ejecutivo decide si
          pide aclaración. Toda decisión queda en la bitácora del caso.
        </p>
      )}
    </section>
  );
}
