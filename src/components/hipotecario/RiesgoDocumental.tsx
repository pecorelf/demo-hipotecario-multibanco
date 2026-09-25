import { useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Kicker } from '@/components/ui';
import { cn } from '@/lib/cn';

/**
 * Reparo predictivo.
 *
 * Antes de que el cliente suba nada, se estima qué documentos tienen más
 * probabilidad de ser reparados según su perfil, y se le pide primero esos
 * con la instrucción exacta. Deja de ser un proceso que detecta errores y
 * pasa a ser uno que los evita.
 *
 * La estimación es determinística y se calcula a partir de reglas del
 * negocio: no hay llamada al modelo, porque en una demostración el resultado
 * tiene que ser el mismo todas las veces.
 */

export interface PerfilCliente {
  independiente: boolean;
  sociedadConyugal: boolean;
  propiedadEnSucesion: boolean;
  segundaVivienda: boolean;
}

interface RiesgoItem {
  documento: string;
  riesgo: number;
  motivo: string;
  instruccion: string;
}

function calcular(perfil: PerfilCliente): RiesgoItem[] {
  const items: RiesgoItem[] = [
    {
      documento: 'Liquidaciones de sueldo',
      riesgo: perfil.independiente ? 78 : 12,
      motivo: perfil.independiente
        ? 'Trabajadores independientes suelen presentar boletas en vez de liquidaciones.'
        : 'Documento estable, rara vez reparado.',
      instruccion: perfil.independiente
        ? 'Sube tu declaración de renta de los últimos dos años y las boletas de los últimos seis meses.'
        : 'Últimas tres liquidaciones, con timbre del empleador.',
    },
    {
      documento: 'Certificado de matrimonio',
      riesgo: perfil.sociedadConyugal ? 64 : 18,
      motivo: perfil.sociedadConyugal
        ? 'En sociedad conyugal se exige además la comparecencia del cónyuge.'
        : 'Lo obtenemos del Registro Civil automáticamente.',
      instruccion: perfil.sociedadConyugal
        ? 'Necesitamos que tu cónyuge se autentique para firmar como co-titular.'
        : 'No necesitas hacer nada: ya lo tenemos.',
    },
    {
      documento: 'Certificado de dominio vigente',
      riesgo: perfil.propiedadEnSucesion ? 86 : 22,
      motivo: perfil.propiedadEnSucesion
        ? 'Las propiedades en sucesión requieren posesión efectiva inscrita.'
        : 'Vigencia de 30 días desde su emisión.',
      instruccion: perfil.propiedadEnSucesion
        ? 'Pide al vendedor la posesión efectiva inscrita antes de avanzar.'
        : 'Debe tener menos de 30 días de emitido.',
    },
    {
      documento: 'Informe de deuda CMF',
      riesgo: perfil.segundaVivienda ? 41 : 9,
      motivo: perfil.segundaVivienda
        ? 'En segunda vivienda se revisa la carga financiera del primer crédito.'
        : 'Lo consultamos nosotros.',
      instruccion: perfil.segundaVivienda
        ? 'Ten a mano el certificado de deuda del crédito hipotecario vigente.'
        : 'No necesitas hacer nada.',
    },
  ];
  return items.sort((a, b) => b.riesgo - a.riesgo);
}

function nivel(r: number) {
  if (r >= 60) return { etiqueta: 'Alta', color: 'text-status-error', barra: 'bg-status-error' };
  if (r >= 30) return { etiqueta: 'Media', color: 'text-status-warning', barra: 'bg-status-warning' };
  return { etiqueta: 'Baja', color: 'text-status-success', barra: 'bg-status-success' };
}

export function RiesgoDocumental({
  perfil,
  className,
}: {
  perfil: PerfilCliente;
  className?: string;
}) {
  const items = useMemo(() => calcular(perfil), [perfil]);
  const criticos = items.filter((i) => i.riesgo >= 60);

  return (
    <section className={cn('rounded-xl border border-border-hairline bg-bg-card shadow-soft px-6 py-6', className)}>
      <div className="flex items-start gap-3">
        <ShieldAlert size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <Kicker tone="muted">Antes de que subas nada</Kicker>
          <h2 className="text-h3 font-semibold text-text-primary mt-1.5">
            {criticos.length > 0
              ? `${criticos.length} de tus documentos suelen ser reparados`
              : 'Tu perfil tiene bajo riesgo de reparos'}
          </h2>
          <p className="text-body-sm text-text-secondary mt-1.5 max-w-measure">
            Antes de pedirte un solo papel, revisamos operaciones parecidas a la tuya y
            calculamos cuáles suelen ser devueltos. Así te pedimos primero esos, y con la
            instrucción exacta para que lleguen bien a la primera.
          </p>
          <p className="text-caption text-text-muted mt-2 max-w-measure">
            Hoy el banco descubre un documento mal presentado cuando ya lo revisó alguien,
            y eso son días. Esto se adelanta a ese momento.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {items.map((it, i) => {
          const n = nivel(it.riesgo);
          return (
            <div key={it.documento}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-body-sm font-medium text-text-primary">
                  {it.documento}
                </span>
                <span className={cn('text-caption font-medium shrink-0', n.color)}>
                  {it.riesgo}% de ser devuelto
                </span>
              </div>

              <div className="mt-1.5 h-1.5 bg-bg-sunken rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', n.barra)}
                  style={{
                    width: `${it.riesgo}%`,
                    transition: 'width .8s cubic-bezier(.2,.7,.3,1)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>

              <p className="text-caption text-text-muted mt-1.5">{it.motivo}</p>
              {it.riesgo >= 30 && (
                <p className="text-body-sm text-text-primary mt-1">
                  <span className="text-text-muted">Qué hacer: </span>
                  {it.instruccion}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
