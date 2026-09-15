/**
 * Barra horizontal comparativa, para distribuciones pequeñas.
 *
 * Se dibuja en div y no en canvas: hereda el color de acento de la marca sin
 * configuración y no agrega dependencias al bundle.
 */
export function BarrasEtapa({
  datos,
  maximo,
}: {
  datos: Array<{ etiqueta: string; valor: number; alerta?: number }>;
  maximo?: number;
}) {
  const tope = maximo ?? Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="space-y-2.5">
      {datos.map((d, i) => (
        <div key={d.etiqueta} className="grid grid-cols-[130px_1fr_40px] gap-3 items-center">
          <span className="text-body-sm text-text-secondary truncate" title={d.etiqueta}>
            {d.etiqueta}
          </span>
          <div className="h-6 bg-bg-sunken relative overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{
                width: `${(d.valor / tope) * 100}%`,
                transition: 'width .8s cubic-bezier(.2,.7,.3,1)',
                transitionDelay: `${i * 70}ms`,
              }}
            />
            {!!d.alerta && d.alerta > 0 && (
              <div
                className="h-full bg-status-error absolute top-0 left-0"
                style={{
                  width: `${(d.alerta / tope) * 100}%`,
                  transition: 'width .8s cubic-bezier(.2,.7,.3,1)',
                  transitionDelay: `${i * 70 + 160}ms`,
                }}
              />
            )}
          </div>
          <span className="text-body-sm font-medium text-text-primary text-right tabular-nums">
            {d.valor}
          </span>
        </div>
      ))}
    </div>
  );
}
