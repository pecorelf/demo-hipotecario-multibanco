import { useEffect, useRef, useState } from 'react';

/**
 * Número que cuenta hasta su valor al entrar en pantalla.
 *
 * Los tableros de la demostración están llenos de cifras estáticas. Animarlas
 * dirige la mirada al dato en el momento en que se presenta, que es
 * precisamente cuando el relator lo está mencionando.
 */
export function Contador({
  valor,
  decimales = 0,
  duracion = 900,
  prefijo = '',
  sufijo = '',
  className = '',
}: {
  valor: number;
  decimales?: number;
  duracion?: number;
  prefijo?: string;
  sufijo?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActual(valor);
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const inicio = performance.now();
        const paso = (t: number) => {
          const k = Math.min((t - inicio) / duracion, 1);
          setActual(valor * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [valor, duracion]);

  return (
    <span ref={ref} className={className}>
      {prefijo}
      {actual.toLocaleString('es-CL', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      })}
      {sufijo}
    </span>
  );
}
