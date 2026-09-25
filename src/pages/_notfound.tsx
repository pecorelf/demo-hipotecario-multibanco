import { Link } from 'react-router-dom';
import { Kicker, PageTitle } from '@/components/ui';
import { BRAND } from '@/lib/brand';

/**
 * Pantalla para direcciones que no existen.
 *
 * Antes cualquier URL mal escrita redirigía en silencio a la vista del cliente,
 * lo que durante una demostración se ve como si la aplicación hubiera saltado
 * sola a otra pantalla. Es preferible decirlo y ofrecer el camino de vuelta.
 */
export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <Kicker tone="muted">Dirección no encontrada</Kicker>
      <PageTitle className="mt-3">Esta vista no existe</PageTitle>
      <p className="text-body-lg text-text-secondary mt-4">
        La dirección que abriste no corresponde a ninguna vista de la
        demostración de {BRAND.shortName}.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
        <Link
          to="/portal"
          className="inline-flex items-center px-5 py-2.5 bg-accent text-white text-body-sm font-medium rounded-md"
        >
          Ver todas las vistas
        </Link>
        <Link
          to="/cliente/seguimiento"
          className="inline-flex items-center px-5 py-2.5 border border-border-hairline text-body-sm rounded-md"
        >
          Ir a la vista del cliente
        </Link>
      </div>
    </div>
  );
}
