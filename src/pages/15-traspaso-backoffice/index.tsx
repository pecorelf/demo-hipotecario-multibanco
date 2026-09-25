/**
 * Traspaso al back office — de la carpeta digital al sistema del banco.
 *
 * Es la vista que une las dos mitades del proceso: el viaje del cliente
 * termina con una carpeta validada, y aquí esa carpeta se convierte en un
 * registro dentro del sistema del banco.
 *
 * El flujo reproduce el control real de la fábrica: se arma un compilado,
 * el abogado lo revisa contra lo que se va a inyectar, aprueba, y recién
 * entonces se dispara la escritura campo por campo. Si un campo falla hay
 * reintentos automáticos, y si se agotan se avisa a una persona.
 *
 * Modelo determinístico, sin llamadas al modelo: la demostración tiene que
 * comportarse igual todas las veces.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────
// Datos del compilado
// ─────────────────────────────────────────────────────────────

type EstadoCampo = 'espera' | 'inyectando' | 'ok' | 'reintento' | 'fallo';

interface CampoInyeccion {
  id: string;
  sistema: string;
  campo: string;
  valor: string;
  origen: string;
  tipo: 'texto' | 'fecha' | 'monto' | 'lista';
  /** Este campo falla los dos primeros intentos: muestra el reintento. */
  conflictivo?: boolean;
}

const CAMPOS: CampoInyeccion[] = [
  { id: 'c1', sistema: 'Core hipotecario', campo: 'Rut titular', valor: '16.482.930-7', origen: 'Cédula de identidad', tipo: 'texto' },
  { id: 'c2', sistema: 'Core hipotecario', campo: 'Nombre titular', valor: BRAND.buyerName, origen: 'Cédula de identidad', tipo: 'texto' },
  { id: 'c3', sistema: 'Core hipotecario', campo: 'Régimen patrimonial', valor: 'Separación de bienes', origen: 'Certificado de matrimonio · Registro Civil', tipo: 'lista' },
  { id: 'c4', sistema: 'Escrituración', campo: 'Rol de avalúo', valor: '2917-45', origen: 'Certificado de dominio vigente', tipo: 'texto' },
  { id: 'c5', sistema: 'Escrituración', campo: 'Superficie útil', valor: '87,4 m²', origen: 'Escritura anterior', tipo: 'texto' },
  { id: 'c6', sistema: 'Escrituración', campo: 'Fecha de inscripción', valor: '12 de marzo de 2019', origen: 'Inscripción CBR', tipo: 'fecha' },
  { id: 'c7', sistema: 'Escrituración', campo: 'Monto del mutuo', valor: 'UF 4.760', origen: 'Cotización final', tipo: 'monto', conflictivo: true },
  { id: 'c8', sistema: 'Seguros', campo: 'Prima desgravamen', valor: '$ 38.420', origen: 'Cotización de seguros', tipo: 'monto' },
  { id: 'c9', sistema: 'Escrituración', campo: 'Notaría asignada', valor: BRAND.notariaName, origen: 'Asignación automática', tipo: 'lista' },
];

const PARRAFOS_COMPILADO = [
  `Comparece don ${BRAND.buyerName}, cédula nacional de identidad número 16.482.930-7, en adelante "el deudor", y ${BRAND.legalName}, en adelante "el banco".`,
  'El deudor declara encontrarse casado bajo el régimen de separación total de bienes, según consta en certificado de matrimonio emitido por el Servicio de Registro Civil e Identificación.',
  `El inmueble objeto del presente contrato corresponde al departamento ubicado en ${BRAND.propertyAddress}, comuna de ${BRAND.propertyComuna}, rol de avalúo 2917-45, con una superficie útil de 87,4 metros cuadrados.`,
  'El banco otorga al deudor un mutuo hipotecario por la cantidad de 4.760 unidades de fomento, que el deudor declara recibir a su entera conformidad.',
];

// ─────────────────────────────────────────────────────────────

export default function TraspasoBackOffice() {
  const navigate = useNavigate();
  const [fase, setFase] = useState<'revision' | 'inyectando' | 'listo'>('revision');
  const [estados, setEstados] = useState<Record<string, EstadoCampo>>({});
  const [bitacora, setBitacora] = useState<string[]>([]);
  const [campoActivo, setCampoActivo] = useState<string | null>(null);
  const temporizadores = useRef<number[]>([]);

  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  const registrar = useCallback((linea: string) => {
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBitacora((b) => [...b, `${hora} · ${linea}`]);
  }, []);

  /** Escribe los campos uno a uno, con reintentos en el que falla. */
  const inyectar = () => {
    setFase('inyectando');
    setBitacora([]);
    registrar('Aprobación del abogado registrada. Inicia la inyección.');

    let t = 0;
    CAMPOS.forEach((c) => {
      const paso = (ms: number, fn: () => void) => {
        t += ms;
        temporizadores.current.push(window.setTimeout(fn, t));
      };

      paso(420, () => {
        setCampoActivo(c.id);
        setEstados((e) => ({ ...e, [c.id]: 'inyectando' }));
      });

      if (c.conflictivo) {
        paso(600, () => {
          setEstados((e) => ({ ...e, [c.id]: 'reintento' }));
          registrar(`${c.campo}: el sistema no respondió. Reintento 1 de 3.`);
        });
        paso(900, () => {
          setEstados((e) => ({ ...e, [c.id]: 'ok' }));
          registrar(`${c.campo}: escrito correctamente en el reintento 2.`);
        });
      } else {
        paso(520, () => {
          setEstados((e) => ({ ...e, [c.id]: 'ok' }));
          registrar(`${c.campo} → ${c.sistema}: escrito.`);
        });
      }
    });

    temporizadores.current.push(
      window.setTimeout(() => {
        setCampoActivo(null);
        setFase('listo');
        registrar('Ingesta terminada. 9 de 9 campos escritos. Acta de verificación disponible.');
      }, t + 500),
    );
  };

  const reiniciar = () => {
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
    setFase('revision');
    setEstados({});
    setBitacora([]);
    setCampoActivo(null);
  };

  const escritos = CAMPOS.filter((c) => estados[c.id] === 'ok').length;

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-14 space-y-10">
      <div>
        <button
          onClick={() => navigate('/ejecutivo')}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft size={14} />
          Volver al panel del ejecutivo
        </button>

        <Kicker className="mt-6">Traspaso al back office</Kicker>
        <PageTitle className="mt-3">
          De la carpeta digital al sistema del banco
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          La carpeta llega validada desde el viaje del cliente. Antes de escribir nada
          en los sistemas, un abogado revisa el compilado contra los datos que se van a
          inyectar. La máquina escribe; la persona autoriza.
        </p>
      </div>

      {/* ── Estado del traspaso ───────────────────────────── */}
      <Reveal>
        <div className="rounded-xl border border-border-hairline bg-bg-card px-6 py-5 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
              Caso
            </span>
            <span className="text-body font-medium text-text-primary">{BRAND.caseRef}</span>
            <span className="w-px h-5 bg-border-hairline" />
            <span className="text-body-sm text-text-secondary">{BRAND.buyerName}</span>
          </div>

          <div className="flex items-center gap-3">
            {fase === 'revision' && (
              <Pill variant="warning">Pendiente de revisión legal</Pill>
            )}
            {fase === 'inyectando' && (
              <Pill variant="info">Escribiendo {escritos} de {CAMPOS.length}</Pill>
            )}
            {fase === 'listo' && <Pill variant="success">Ingesta completa</Pill>}
          </div>
        </div>
      </Reveal>

      {/* ── Pantalla partida ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Izquierda · el compilado */}
        <Reveal>
          <section className="rounded-xl border border-border-hairline bg-bg-card h-full flex flex-col">
            <header className="px-6 py-4 border-b border-border-hairline flex items-center gap-2">
              <FileText size={15} className="text-text-muted" />
              <span className="text-body-sm font-medium text-text-primary">
                Compilado generado
              </span>
              <span className="ml-auto text-caption text-text-muted">
                Borrador de escritura · 4 párrafos
              </span>
            </header>

            <div className="p-6 space-y-4 flex-1">
              {PARRAFOS_COMPILADO.map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    'text-body-sm leading-relaxed transition-colors duration-300',
                    campoActivo && i === Math.min(Math.floor(CAMPOS.findIndex((c) => c.id === campoActivo) / 2.5), 3)
                      ? 'text-text-primary bg-accent-soft -mx-2 px-2 py-1 rounded-md'
                      : 'text-text-secondary',
                  )}
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Derecha · lo que se inyecta */}
        <Reveal delay={90}>
          <section className="rounded-xl border border-border-hairline bg-bg-card h-full flex flex-col">
            <header className="px-6 py-4 border-b border-border-hairline flex items-center gap-2">
              <ShieldCheck size={15} className="text-text-muted" />
              <span className="text-body-sm font-medium text-text-primary">
                Datos que se escribirán en el sistema
              </span>
              <span className="ml-auto text-caption text-text-muted">
                {CAMPOS.length} campos
              </span>
            </header>

            <div className="divide-y divide-border-hairline flex-1">
              {CAMPOS.map((c) => {
                const estado = estados[c.id] ?? 'espera';
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'px-6 py-3 flex items-start gap-3 transition-colors',
                      campoActivo === c.id && 'bg-accent-soft',
                    )}
                  >
                    <span className="mt-0.5 shrink-0">
                      {estado === 'ok' && <Check size={14} className="text-status-success" />}
                      {estado === 'inyectando' && (
                        <Loader2 size={14} className="text-accent animate-spin" />
                      )}
                      {estado === 'reintento' && (
                        <AlertTriangle size={14} className="text-status-warning" />
                      )}
                      {estado === 'espera' && (
                        <span className="block w-3.5 h-3.5 rounded-full border border-border-hairline" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-body-sm text-text-primary font-medium">
                          {c.campo}
                        </span>
                        <span className="text-caption text-text-muted shrink-0">
                          {c.sistema}
                        </span>
                      </div>
                      <div className="text-body-sm text-text-secondary mt-0.5 break-words">
                        {c.valor}
                      </div>
                      <div className="text-caption text-text-muted mt-0.5">
                        Origen: {c.origen}
                        {estado === 'reintento' && ' · reintentando'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>
      </div>

      {/* ── Autorización y bitácora ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <Reveal>
          <section className="rounded-xl border border-border-hairline bg-bg-card px-6 py-6">
            {fase === 'revision' ? (
              <>
                <h2 className="text-h3 font-semibold text-text-primary">
                  Revisión del abogado
                </h2>
                <p className="text-body-sm text-text-secondary mt-2 max-w-measure">
                  Compara el compilado de la izquierda con los campos de la derecha. Al
                  aprobar, la información se escribe en los sistemas del banco y queda
                  registrada en la bitácora. Nada se escribe antes de esta aprobación.
                </p>
                <button
                  onClick={inyectar}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-body-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                  Aprobar e inyectar al sistema
                </button>
              </>
            ) : fase === 'inyectando' ? (
              <>
                <h2 className="text-h3 font-semibold text-text-primary">
                  Escribiendo en los sistemas
                </h2>
                <p className="text-body-sm text-text-secondary mt-2">
                  Campo por campo, con verificación de escritura. Si un campo no responde,
                  se reintenta hasta tres veces antes de avisar a una persona.
                </p>
                <div className="mt-5 h-2 bg-bg-sunken rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${(escritos / CAMPOS.length) * 100}%`,
                      transition: 'width .4s cubic-bezier(.2,.7,.3,1)',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-h3 font-semibold text-text-primary">
                  Ingesta verificada
                </h2>
                <p className="text-body-sm text-text-secondary mt-2 max-w-measure">
                  Los nueve campos quedaron escritos y verificados contra el compilado
                  aprobado. Un campo requirió reintento y se resolvió sin intervención.
                  El acta de verificación queda asociada al caso.
                </p>
                <div className="mt-5 flex gap-3 flex-wrap">
                  <button
                    onClick={() => navigate('/ejecutivo')}
                    className="inline-flex items-center px-5 py-2.5 bg-accent text-white text-body-sm font-medium rounded-md"
                  >
                    Volver al caso
                  </button>
                  <button
                    onClick={reiniciar}
                    className="inline-flex items-center px-5 py-2.5 border border-border-hairline text-body-sm rounded-md hover:bg-bg-page transition-colors"
                  >
                    Repetir la demostración
                  </button>
                </div>
              </>
            )}
          </section>
        </Reveal>

        <Reveal delay={90}>
          <section className="rounded-xl border border-border-hairline bg-bg-card px-5 py-5 h-full">
            <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
              Bitácora de auditoría
            </span>
            <div className="mt-3 space-y-1.5 max-h-[280px] overflow-y-auto">
              {bitacora.length === 0 ? (
                <p className="text-body-sm text-text-muted">
                  Sin movimientos. La bitácora registra cada escritura con su hora.
                </p>
              ) : (
                bitacora.map((l, i) => (
                  <p key={i} className="text-caption text-text-secondary leading-relaxed">
                    {l}
                  </p>
                ))
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
