import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Aparición al entrar en pantalla.
 *
 * Se apoya en IntersectionObserver en vez de animar al montar, para que el
 * contenido que está bajo el pliegue se revele cuando la persona llega a él y
 * no antes. Respeta la preferencia de movimiento reducido del sistema.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: 'opacity .65s cubic-bezier(.2,.7,.3,1), transform .65s cubic-bezier(.2,.7,.3,1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
