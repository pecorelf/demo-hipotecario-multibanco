/**
 * Anillo de progreso en SVG.
 *
 * Para porcentajes que hoy aparecen como número suelto: avance del caso,
 * cumplimiento de nivel de servicio, documentos aprobados sobre el total.
 */
export function Anillo({
  porcentaje,
  tamano = 96,
  grosor = 8,
  etiqueta,
  color,
}: {
  porcentaje: number;
  tamano?: number;
  grosor?: number;
  etiqueta?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, porcentaje));
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle
          cx={tamano / 2} cy={tamano / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={grosor} className="text-border-hairline"
        />
        <circle
          cx={tamano / 2} cy={tamano / 2} r={r} fill="none"
          stroke={color ?? 'var(--color-accent-primary)'} strokeWidth={grosor} strokeLinecap="butt"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.7,.3,1)' }}
        />
      </svg>
      <span className="text-body-sm font-medium text-text-primary tabular-nums -mt-[calc(50%+2px)] mb-[calc(50%-14px)]">
        {Math.round(pct)}%
      </span>
      {etiqueta && <span className="text-caption text-text-muted">{etiqueta}</span>}
    </div>
  );
}
