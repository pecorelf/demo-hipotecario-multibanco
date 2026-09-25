import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Reloj de compromiso con el cliente.
 *
 * Convierte la promesa de plazo en algo medible en pantalla: cuántos días
 * quedan, quién tiene la pelota, y qué pasa si el tramo se vence. Es lo
 * primero que mira una jefatura, porque traduce el proceso a compromiso.
 */

export type EstadoReloj = 'holgado' | 'ajustado' | 'vencido';

export function clasificarReloj(diasRestantes: number): EstadoReloj {
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= 2) return 'ajustado';
  return 'holgado';
}

const ESTILO: Record<EstadoReloj, { barra: string; texto: string; fondo: string }> = {
  holgado:  { barra: 'bg-status-success', texto: 'text-status-success', fondo: 'bg-status-success-bg' },
  ajustado: { barra: 'bg-status-warning', texto: 'text-status-warning', fondo: 'bg-status-warning-bg' },
  vencido:  { barra: 'bg-status-error',   texto: 'text-status-error',   fondo: 'bg-status-error-bg' },
};

export function RelojCompromiso({
  diasRestantes,
  diasTotales,
  responsable,
  hito,
  compacto = false,
  className,
}: {
  diasRestantes: number;
  diasTotales: number;
  responsable: string;
  hito: string;
  compacto?: boolean;
  className?: string;
}) {
  const estado = clasificarReloj(diasRestantes);
  const e = ESTILO[estado];
  const consumido = Math.min(100, Math.max(0, ((diasTotales - diasRestantes) / diasTotales) * 100));

  if (compacto) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', e.texto, className)}>
        {estado === 'vencido' ? <AlertTriangle size={12} /> : <Clock size={12} />}
        <span className="text-caption font-medium tabular-nums">
          {estado === 'vencido'
            ? `${Math.abs(diasRestantes)} d de atraso`
            : `${diasRestantes} d para ${hito}`}
        </span>
      </span>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border-hairline bg-bg-card px-5 py-4', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
          Compromiso con el cliente
        </span>
        <span className={cn('text-caption font-medium', e.texto)}>
          {estado === 'vencido' ? 'Fuera de plazo' : estado === 'ajustado' ? 'Ajustado' : 'En plazo'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn('text-3xl font-semibold leading-none tabular-nums', e.texto)}>
          {Math.abs(diasRestantes)}
        </span>
        <span className="text-body-sm text-text-secondary">
          {estado === 'vencido' ? 'días de atraso' : 'días para ' + hito}
        </span>
      </div>

      <div className="mt-3 h-2 bg-bg-sunken rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', e.barra)}
          style={{ width: `${consumido}%`, transition: 'width .8s cubic-bezier(.2,.7,.3,1)' }}
        />
      </div>

      <p className="text-caption text-text-muted mt-2.5">
        Responsable del tramo: <span className="text-text-secondary">{responsable}</span>
        {estado === 'vencido' && ' · escalado automáticamente a jefatura'}
      </p>
    </div>
  );
}
