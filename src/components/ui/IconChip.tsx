import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Icono dentro de una cápsula de color.
 *
 * Un icono suelto junto a un título se pierde: no tiene peso suficiente para
 * anclar la sección. Envolverlo en una superficie con el acento de la marca
 * le da presencia sin recurrir a más tipografía, y es lo que distingue a una
 * interfaz de producto de una maqueta.
 */

type Tono = 'acento' | 'neutro' | 'exito' | 'alerta' | 'error';

const TONO: Record<Tono, string> = {
  acento: 'bg-accent-soft text-accent',
  neutro: 'bg-bg-sunken text-text-secondary',
  exito: 'bg-status-success-bg text-status-success',
  alerta: 'bg-status-warning-bg text-status-warning',
  error: 'bg-status-error-bg text-status-error',
};

const TAMANO = {
  sm: 'w-8 h-8 rounded-md',
  md: 'w-10 h-10 rounded-lg',
  lg: 'w-12 h-12 rounded-xl',
};

export function IconChip({
  children,
  tono = 'acento',
  tamano = 'md',
  className,
}: {
  children: ReactNode;
  tono?: Tono;
  tamano?: keyof typeof TAMANO;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        TONO[tono],
        TAMANO[tamano],
        className,
      )}
    >
      {children}
    </span>
  );
}
