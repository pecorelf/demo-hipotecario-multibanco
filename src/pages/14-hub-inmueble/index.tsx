/**
 * Hub del Inmueble · Custodia Digital del Expediente Hipotecario
 *
 * Vista que sostiene la relación cliente-banco DESPUÉS de cursada la
 * hipoteca. Reúne en un solo lugar la bóveda documental completa,
 * la línea de tiempo del inmueble, los KPIs económicos y un conjunto
 * de acciones que mantienen al cliente dentro del ecosistema {BRAND.shortName}.
 *
 * Diseñado como vista DUAL:
 *  - `?viewer=cliente`   → vista del cliente (default)
 *  - `?viewer=ejecutivo` → vista del banco con acciones de gestión
 *  - `?shared=1`         → modo compartido (read-only, banner visible)
 *
 * Ruta cliente:    /cliente/mi-inmueble
 * Ruta ejecutivo:  /ejecutivo/inmueble
 *
 * Pedido formal de Macarena Ibáñez en la sesión del 11/06/2026:
 * "Sería bueno agregar la custodia digital del documento, ya que se
 *  vendió la casa pero el orquestador queda como repositorio de
 *  todos los papeles del proceso."
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Home as HomeIcon,
  KeyRound,
  Link as LinkIcon,
  RotateCw,
  Share2,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

// ─── Tipos ──────────────────────────────────────────────────────

type ViewerMode = 'cliente' | 'ejecutivo' | 'shared';

type VigenciaTipo = 'permanente' | 'vigente' | 'vencido' | 'historico';

interface CustodiaDoc {
  id: string;
  name: string;
  category: 'proceso' | 'cierre' | 'inmueble' | 'historico';
  subCategory: string;
  author: string;
  date: string;            // ISO
  vigencia: VigenciaTipo;
  vigenciaLabel?: string;  // ej. "Permanente", "Vencido", "Vigente 14 días más"
  size?: string;           // ej. "245 KB"
}

interface InmuebleData {
  direccion: string;
  comuna: string;
  caseRef: string;
  fechaCierre: string;
  superficie: string;
  edificio: string;
  // KPIs
  valorTasadoUF: number;
  saldoDeudorUF: number;
  pagadoUF: number;
  dividendoMensualUF: number;
  plazoRestante: string;
  // Plusvalía: solo etiqueta cualitativa, sin número
  plusvaliaEtiqueta: 'positiva' | 'estable' | 'sin_dato';
}

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  type: 'cierre' | 'pago' | 'tasacion' | 'aprobacion' | 'reciente';
}

// ─── Mock data ──────────────────────────────────────────────────

const INMUEBLE: InmuebleData = {
  direccion: 'Av. Los Leones 1240, dpto 803',
  comuna: 'Providencia',
  caseRef: 'HIP-2026-0042',
  fechaCierre: '2026-06-11',
  superficie: '92 m² útiles',
  edificio: 'Edificio Parque Los Leones',
  valorTasadoUF: 6850,
  saldoDeudorUF: 4720,
  pagadoUF: 40,
  dividendoMensualUF: 28.5,
  plazoRestante: '24 años, 11 meses',
  plusvaliaEtiqueta: 'positiva',
};

const TIMELINE: TimelineEvent[] = [
  {
    date: '2026-06-11',
    title: 'Hipoteca cursada',
    description: 'Operación HIP-2026-0042 inscrita en el CBR de Santiago.',
    type: 'cierre',
  },
  {
    date: '2026-06-08',
    title: 'Escrituración firmada',
    description: 'Notaría Fernando Undurraga Silva.',
    type: 'cierre',
  },
  {
    date: '2026-05-28',
    title: 'Aprobación crediticia',
    description: 'Crédito por UF 4.760 a 25 años.',
    type: 'aprobacion',
  },
  {
    date: '2026-05-22',
    title: 'Tasación inicial',
    description: 'Valor tasado: UF 6.850. Tasaciones Andes Ltda.',
    type: 'tasacion',
  },
];

const DOCUMENTOS: CustodiaDoc[] = [
  // PROCESO - Estudio de títulos
  {
    id: 'd-1',
    name: 'Certificado de Dominio Vigente',
    category: 'proceso',
    subCategory: 'Estudio de Títulos',
    author: 'Patricia Soto Miranda',
    date: '2026-05-15',
    vigencia: 'vencido',
    vigenciaLabel: 'Vencido · expiró 14/06/2026',
    size: '245 KB',
  },
  {
    id: 'd-2',
    name: 'Certificado de Hipotecas y Gravámenes',
    category: 'proceso',
    subCategory: 'Estudio de Títulos',
    author: 'Patricia Soto Miranda',
    date: '2026-05-12',
    vigencia: 'vencido',
    vigenciaLabel: 'Vencido · expiró 11/06/2026',
    size: '198 KB',
  },
  {
    id: 'd-3',
    name: 'Certificado de No Expropiación',
    category: 'proceso',
    subCategory: 'Estudio de Títulos',
    author: 'Patricia Soto Miranda',
    date: '2026-05-10',
    vigencia: 'vencido',
    vigenciaLabel: 'Vencido · expiró 09/06/2026',
    size: '156 KB',
  },
  {
    id: 'd-4',
    name: 'Inscripción definitiva en CBR',
    category: 'proceso',
    subCategory: 'Estudio de Títulos',
    author: 'CBR Santiago',
    date: '2026-06-11',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '412 KB',
  },
  // PROCESO - Tasación
  {
    id: 'd-5',
    name: 'Informe de Tasación',
    category: 'proceso',
    subCategory: 'Tasación',
    author: 'Tasaciones Andes Ltda.',
    date: '2026-05-22',
    vigencia: 'vigente',
    vigenciaLabel: 'Vigente 7 meses más',
    size: '1,2 MB',
  },
  {
    id: 'd-6',
    name: 'Aprobación del valor tasado',
    category: 'proceso',
    subCategory: 'Tasación',
    author: `Camila Reinoso · ${BRAND.shortName}`,
    date: '2026-05-24',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '89 KB',
  },
  // PROCESO - Carpeta comercial
  {
    id: 'd-7',
    name: 'Liquidaciones de sueldo (3 períodos)',
    category: 'proceso',
    subCategory: 'Carpeta Comercial',
    author: 'Andrés Fuenzalida',
    date: '2026-05-18',
    vigencia: 'historico',
    vigenciaLabel: 'Histórico',
    size: '780 KB',
  },
  {
    id: 'd-8',
    name: 'Certificado de cotizaciones AFP',
    category: 'proceso',
    subCategory: 'Carpeta Comercial',
    author: 'AFP Habitat',
    date: '2026-05-18',
    vigencia: 'historico',
    vigenciaLabel: 'Histórico',
    size: '187 KB',
  },
  {
    id: 'd-9',
    name: 'Carpeta Tributaria para Créditos',
    category: 'proceso',
    subCategory: 'Carpeta Comercial',
    author: 'SII.cl',
    date: '2026-05-19',
    vigencia: 'historico',
    vigenciaLabel: 'Histórico',
    size: '356 KB',
  },
  // CIERRE
  {
    id: 'd-10',
    name: 'Escritura pública de compraventa',
    category: 'cierre',
    subCategory: 'Documentos notariales',
    author: 'Notaría Fernando Undurraga Silva',
    date: '2026-06-08',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '2,4 MB',
  },
  {
    id: 'd-11',
    name: 'Mandato hipotecario',
    category: 'cierre',
    subCategory: 'Documentos notariales',
    author: 'Notaría Fernando Undurraga Silva',
    date: '2026-06-08',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '892 KB',
  },
  {
    id: 'd-12',
    name: 'Pagaré',
    category: 'cierre',
    subCategory: 'Documentos notariales',
    author: 'Notaría Fernando Undurraga Silva',
    date: '2026-06-08',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '345 KB',
  },
  // INMUEBLE
  {
    id: 'd-13',
    name: 'Reglamento de Copropiedad',
    category: 'inmueble',
    subCategory: 'Documentos del edificio',
    author: 'Comunidad Edificio Parque Los Leones',
    date: '2018-03-15',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '1,8 MB',
  },
  {
    id: 'd-14',
    name: 'Plano arquitectónico unidad 1203',
    category: 'inmueble',
    subCategory: 'Documentos del edificio',
    author: 'Inmobiliaria Los Almendros',
    date: '2017-09-22',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '4,1 MB',
  },
  {
    id: 'd-15',
    name: 'Permiso de Edificación',
    category: 'inmueble',
    subCategory: 'Documentos del edificio',
    author: 'DOM Providencia',
    date: '2016-11-04',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '567 KB',
  },
  {
    id: 'd-16',
    name: 'Recepción definitiva',
    category: 'inmueble',
    subCategory: 'Documentos del edificio',
    author: 'DOM Providencia',
    date: '2018-02-22',
    vigencia: 'permanente',
    vigenciaLabel: 'Permanente',
    size: '423 KB',
  },
  // HISTÓRICOS
  {
    id: 'd-17',
    name: 'Estado de cuenta hipotecaria',
    category: 'historico',
    subCategory: 'Periódicos',
    author: `${BRAND.shortName} Hipotecario`,
    date: '2026-10-05',
    vigencia: 'vigente',
    vigenciaLabel: 'Mes actual',
    size: '78 KB',
  },
];

// ─── Componente principal ───────────────────────────────────────

export default function HubInmueble() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Detecta el modo de visor desde la URL
  const viewerParam = searchParams.get('viewer');
  const sharedParam = searchParams.get('shared');
  const viewer: ViewerMode = sharedParam === '1'
    ? 'shared'
    : viewerParam === 'ejecutivo'
    ? 'ejecutivo'
    : 'cliente';

  // Detecta categoría a mostrar en la bóveda (tabs)
  const [activeCategory, setActiveCategory] = useState<CustodiaDoc['category']>('proceso');

  // Modales
  const [openModal, setOpenModal] = useState<
    | null
    | 'refinanciar'
    | 'vender'
    | 'comprar'
    | 'compartir'
    | 'reemision'
    | 'preaprobar'
    | 'oferta-refi'
    | 'cross-sell'
  >(null);

  const docsInCategory = useMemo(
    () => DOCUMENTOS.filter((d) => d.category === activeCategory),
    [activeCategory],
  );

  const vencidos = useMemo(
    () => DOCUMENTOS.filter((d) => d.vigencia === 'vencido'),
    [],
  );

  const isCliente = viewer === 'cliente';
  const isEjecutivo = viewer === 'ejecutivo';
  const isShared = viewer === 'shared';

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-14 py-8 lg:py-12">
      {/* BANNER de modo compartido */}
      {isShared && (
        <div className="mb-6 border border-accent/40 bg-bg-card p-4 flex items-start gap-3">
          <Share2 size={18} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-body-sm font-semibold text-text-primary">
              Vista compartida por Andrés Fuenzalida
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              Modo solo lectura · El link caduca el 25 de junio de 2026.
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate(isEjecutivo ? '/ejecutivo' : '/')}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft size={14} />
          {isEjecutivo ? 'Volver al cockpit' : 'Volver al inicio'}
        </button>
        {!isShared && (
          <button
            onClick={() => setOpenModal('compartir')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-hairline text-body-sm hover:bg-bg-sunken transition-colors"
          >
            <Share2 size={14} />
            Compartir acceso
          </button>
        )}
      </div>

      {/* BLOQUE 1 — HERO del inmueble */}
      <section className="border-y border-border-hairline py-8 lg:py-10">
        <Kicker>
          {isEjecutivo
            ? `Bóveda de Andrés Fuenzalida · ${INMUEBLE.caseRef}`
            : 'Tu inmueble bajo custodia digital'}
        </Kicker>
        <PageTitle className="mt-3">{INMUEBLE.direccion}</PageTitle>
        <div className="mt-2 flex items-center gap-2 flex-wrap text-body-sm text-text-secondary">
          <span>{INMUEBLE.comuna}</span>
          <span className="text-border-hairline">·</span>
          <span>{INMUEBLE.edificio}</span>
          <span className="text-border-hairline">·</span>
          <span>{INMUEBLE.superficie}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Pill variant="success" size="sm">
            <CheckCircle2 size={11} className="inline mr-1" />
            Hipoteca cursada
          </Pill>
          <Pill variant="default" size="sm">
            <Calendar size={11} className="inline mr-1" />
            {formatDate(INMUEBLE.fechaCierre)}
          </Pill>
          <Pill variant="default" size="sm">
            Op. {INMUEBLE.caseRef}
          </Pill>
        </div>
      </section>

      {/* BLOQUE 2 — KPIs */}
      <section className="mt-10">
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          Tu inmueble en cifras
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            icon={<HomeIcon size={14} />}
            label="Valor tasado"
            value={`UF ${INMUEBLE.valorTasadoUF.toLocaleString('es-CL')}`}
            unit="al cierre"
          />
          <KpiCard
            icon={<Wallet size={14} />}
            label="Saldo deudor"
            value={`UF ${INMUEBLE.saldoDeudorUF.toLocaleString('es-CL')}`}
            unit={`Pagado · UF ${INMUEBLE.pagadoUF}`}
          />
          <KpiCard
            icon={<Clock size={14} />}
            label="Plazo restante"
            value={INMUEBLE.plazoRestante}
            unit={`Dividendo · UF ${INMUEBLE.dividendoMensualUF}`}
          />
          <KpiCard
            icon={<TrendingUp size={14} />}
            label="Plusvalía estimada"
            value="Positiva"
            unit="Mercado vs. cierre"
            highlight
          />
        </div>
      </section>

      {/* BLOQUE 3 — Línea de tiempo */}
      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-text-primary mb-4">
          Línea de tiempo del inmueble
        </h2>
        <div className="border border-border-hairline bg-bg-card p-5">
          <ul className="space-y-4">
            {TIMELINE.map((ev, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    ev.type === 'cierre' ? 'bg-accent' : 'bg-text-secondary/40',
                  )} />
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px h-12 bg-border-hairline mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="text-caption text-text-muted">
                    {formatDate(ev.date)}
                  </div>
                  <div className="text-body-sm font-medium text-text-primary mt-0.5">
                    {ev.title}
                  </div>
                  {ev.description && (
                    <div className="text-caption text-text-secondary mt-1">
                      {ev.description}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BLOQUE 4 — BÓVEDA DOCUMENTAL */}
      <section className="mt-12">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary">
              Bóveda documental
            </h2>
            <p className="text-body-sm text-text-secondary mt-1">
              {DOCUMENTOS.length} documentos bajo custodia · vigencias actualizadas
            </p>
          </div>
        </div>

        {/* Banner de documentos vencidos */}
        {vencidos.length > 0 && !isShared && (
          <div className="mb-4 border-l-2 border-status-warning bg-status-warning-bg/40 p-4 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <RotateCw size={16} className="text-status-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-text-primary">
                  {vencidos.length} documentos con vigencia expirada
                </div>
                <div className="text-caption text-text-secondary mt-0.5 leading-relaxed">
                  {isEjecutivo
                    ? 'El cliente tiene certificados vencidos. Podés gestionar la reemisión por él.'
                    : 'Si los necesitás para una nueva operación o un trámite, podemos solicitarlos por ti directamente en el organismo emisor.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpenModal('reemision')}
              className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted transition-colors whitespace-nowrap"
            >
              Solicitar reemisión
            </button>
          </div>
        )}

        {/* Tabs por categoría */}
        <div className="border-b border-border-hairline mb-4 flex gap-1 overflow-x-auto">
          {(['proceso', 'cierre', 'inmueble', 'historico'] as const).map((cat) => {
            const count = DOCUMENTOS.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 text-body-sm border-b-2 transition-colors whitespace-nowrap',
                  activeCategory === cat
                    ? 'border-accent text-text-primary font-medium'
                    : 'border-transparent text-text-secondary hover:text-text-primary',
                )}
              >
                {CATEGORY_LABELS[cat]} · {count}
              </button>
            );
          })}
        </div>

        {/* Lista de documentos */}
        <ul className="space-y-2">
          {docsInCategory.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} viewer={viewer} />
          ))}
        </ul>
      </section>

      {/* BLOQUE 5 — ACCIONES */}
      {!isShared && (
        <section className="mt-12 pt-10 border-t border-border-hairline">
          <Kicker>
            {isEjecutivo ? 'Acciones del banco' : 'Acciones que puedes tomar'}
          </Kicker>
          <h2 className="text-h3 font-semibold text-text-primary mt-2 mb-6">
            {isEjecutivo
              ? 'Gestiona la relación con este cliente'
              : 'Tu inmueble es la puerta a más posibilidades'}
          </h2>

          {isCliente && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                icon={<RotateCw size={16} />}
                title="Refinanciar"
                description="Las tasas pueden haber cambiado. Consulta tu opción de mejorar las condiciones de tu hipoteca."
                onClick={() => setOpenModal('refinanciar')}
              />
              <ActionCard
                icon={<KeyRound size={16} />}
                title="Vender mi inmueble"
                description="Preparamos automáticamente el paquete de documentos que necesita el comprador."
                onClick={() => setOpenModal('vender')}
              />
              <ActionCard
                icon={<HomeIcon size={16} />}
                title="Comprar otro inmueble"
                description="Como cliente nuestro, tu próxima hipoteca puede ser pre-aprobada en menos pasos."
                onClick={() => setOpenModal('comprar')}
              />
            </div>
          )}

          {isEjecutivo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                icon={<Sparkles size={16} />}
                title="Generar oferta de refinanciamiento"
                description="Calculá una oferta basada en el saldo deudor actual y las tasas vigentes."
                onClick={() => setOpenModal('oferta-refi')}
              />
              <ActionCard
                icon={<TrendingUp size={16} />}
                title="Pre-aprobar nueva hipoteca"
                description="El historial del cliente permite agilizar una segunda operación."
                onClick={() => setOpenModal('preaprobar')}
              />
              <ActionCard
                icon={<KeyRound size={16} />}
                title="Marcar como prospecto cross-sell"
                description="Suma este cliente a la campaña de cuenta corriente premium o inversión."
                onClick={() => setOpenModal('cross-sell')}
              />
            </div>
          )}
        </section>
      )}

      {/* Footer · disclaimer */}
      <section className="mt-12 pt-6 border-t border-border-hairline">
        <p className="text-caption text-text-muted leading-relaxed max-w-3xl">
          La custodia digital del expediente hipotecario se mantiene activa mientras
          el crédito esté vigente. Las solicitudes de reemisión generan trámites
          ante los organismos emisores correspondientes (CBR, SII, DOM) y pueden
          tener costos asociados que se informan al iniciar el trámite.
        </p>
      </section>

      {/* Modales */}
      {openModal === 'refinanciar' && (
        <RefinanciarModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'vender' && (
        <VenderModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'comprar' && (
        <ComprarOtroModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'compartir' && (
        <CompartirAccesoModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'reemision' && (
        <ReemisionModal docs={vencidos} onClose={() => setOpenModal(null)} viewer={viewer} />
      )}
      {openModal === 'oferta-refi' && (
        <OfertaRefiModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'preaprobar' && (
        <PreaprobarModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'cross-sell' && (
        <CrossSellModal onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
}

// ─── Constantes ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CustodiaDoc['category'], string> = {
  proceso: 'Del proceso',
  cierre: 'Del cierre',
  inmueble: 'Del inmueble',
  historico: 'Históricos',
};

// ─── Subcomponentes principales ─────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 border',
        highlight ? 'border-accent bg-bg-card' : 'border-border-hairline bg-bg-card',
      )}
    >
      <div className="flex items-center gap-2 text-text-muted">
        <span className={cn(highlight && 'text-accent')}>{icon}</span>
        <span className="text-caption uppercase tracking-[0.1em]">{label}</span>
      </div>
      <div
        className={cn(
          'mt-2 text-h3 font-semibold tabular-nums',
          highlight ? 'text-accent' : 'text-text-primary',
        )}
      >
        {value}
      </div>
      {unit && (
        <div className="text-caption text-text-secondary mt-1">{unit}</div>
      )}
    </div>
  );
}

function DocumentRow({ doc, viewer }: { doc: CustodiaDoc; viewer: ViewerMode }) {
  const isShared = viewer === 'shared';
  return (
    <li className="border border-border-hairline bg-bg-card p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FileText size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-body-sm font-medium text-text-primary">
                {doc.name}
              </div>
              <VigenciaBadge vigencia={doc.vigencia} label={doc.vigenciaLabel} />
            </div>
            <div className="text-caption text-text-secondary mt-1">
              {doc.subCategory} · {doc.author} · {formatDate(doc.date)}
              {doc.size && ` · ${doc.size}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              /* Demo: no descarga real */
              alert(`Descarga simulada: ${doc.name}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-hairline text-caption hover:bg-bg-sunken transition-colors"
          >
            <Download size={12} />
            {isShared ? 'Ver' : 'Descargar'}
          </button>
        </div>
      </div>
    </li>
  );
}

function VigenciaBadge({ vigencia, label }: { vigencia: VigenciaTipo; label?: string }) {
  const config = {
    permanente: { variant: 'default' as const, text: label || 'Permanente' },
    vigente: { variant: 'success' as const, text: label || 'Vigente' },
    vencido: { variant: 'error' as const, text: label || 'Vencido' },
    historico: { variant: 'default' as const, text: label || 'Histórico' },
  };
  const cfg = config[vigencia];
  return (
    <Pill variant={cfg.variant} size="sm">
      {cfg.text}
    </Pill>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left border border-border-hairline bg-bg-card p-5 hover:border-accent hover:shadow-soft transition-all group"
    >
      <div className="w-10 h-10 inline-flex items-center justify-center bg-bg-page text-text-primary group-hover:bg-accent group-hover:text-text-inverse transition-colors">
        {icon}
      </div>
      <div className="text-body-sm font-semibold text-text-primary mt-3">
        {title}
      </div>
      <div className="text-caption text-text-secondary mt-1 leading-relaxed">
        {description}
      </div>
    </button>
  );
}

// ─── Modales ────────────────────────────────────────────────────

function ModalShell({
  title,
  kicker,
  children,
  onClose,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-text-primary/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div className={cn(
          'bg-bg-card border border-border-hairline shadow-lifted w-full pointer-events-auto max-h-[85vh] overflow-y-auto',
          maxWidth,
        )}>
          <div className="px-6 py-4 border-b border-border-hairline flex items-start justify-between gap-3 sticky top-0 bg-bg-card">
            <div>
              {kicker && (
                <div className="text-caption uppercase tracking-[0.1em] text-text-muted">
                  {kicker}
                </div>
              )}
              <div className="text-body font-semibold text-text-primary mt-0.5">
                {title}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 inline-flex items-center justify-center hover:bg-bg-sunken transition-colors"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}

function RefinanciarModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell kicker="Acción del cliente" title="Refinanciar tu hipoteca" onClose={onClose}>
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        Tu hipoteca actual está a una tasa de mercado distinta a la vigente hoy.
        Calculá si refinanciar te conviene.
      </p>
      <div className="border border-border-hairline bg-bg-page p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Tu tasa actual</span>
          <span className="text-body-sm font-semibold text-text-primary tabular-nums">4,80% UF</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Tasa {BRAND.shortName} hoy</span>
          <span className="text-body-sm font-semibold text-accent tabular-nums">4,15% UF</span>
        </div>
        <div className="h-px bg-border-hairline" />
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Ahorro mensual estimado</span>
          <span className="text-h3 font-semibold text-accent tabular-nums">UF 3,4</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">A 24 años, ahorro total</span>
          <span className="text-body-sm font-semibold text-text-primary tabular-nums">UF 980</span>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Más tarde
        </button>
        <button
          onClick={() => {
            alert('Tu ejecutiva Camila Reinoso te contactará dentro de las próximas 24 horas para revisar la propuesta.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Solicitar simulación
        </button>
      </div>
    </ModalShell>
  );
}

function VenderModal({ onClose }: { onClose: () => void }) {
  const docsParaVenta = [
    'Certificado de Dominio Vigente (lo solicitamos por ti)',
    'Certificado de Hipotecas y Gravámenes (lo solicitamos por ti)',
    'Certificado de No Expropiación (lo solicitamos por ti)',
    'Copia de la escritura pública',
    'Reglamento de Copropiedad',
    'Plano arquitectónico',
    'Estado de cuenta hipotecaria al día',
  ];
  return (
    <ModalShell kicker="Acción del cliente" title="Vender mi inmueble" onClose={onClose} maxWidth="max-w-xl">
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        Preparamos el paquete documental que vas a necesitar para vender tu inmueble.
        Los certificados con vigencia los solicitamos por ti directamente al organismo emisor.
      </p>
      <div className="border border-border-hairline bg-bg-page p-4">
        <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2">
          Paquete documental para venta
        </div>
        <ul className="space-y-2">
          {docsParaVenta.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-text-primary">
              <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
              {d}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 text-caption text-text-muted leading-relaxed">
        Tiempo estimado para el paquete completo: 3 a 5 días hábiles. Te notificamos
        cuando esté listo para descargar.
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Cancelar
        </button>
        <button
          onClick={() => {
            alert('Generación del paquete documental iniciada. Te notificaremos cuando esté listo.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Generar paquete
        </button>
      </div>
    </ModalShell>
  );
}

function ComprarOtroModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell kicker="Acción del cliente" title="Comprar otro inmueble" onClose={onClose}>
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        Como cliente {BRAND.shortName} con historial hipotecario al día, tu próxima operación
        puede arrancar con datos ya validados.
      </p>
      <div className="border border-border-hairline bg-bg-page p-4 space-y-3">
        <div>
          <div className="text-caption uppercase tracking-[0.1em] text-text-muted">
            Pre-aprobación express
          </div>
          <div className="text-h3 font-semibold text-text-primary mt-1">
            Hasta UF 5.200
          </div>
          <div className="text-caption text-text-secondary mt-1">
            Estimación basada en tu historial de pagos
          </div>
        </div>
        <div className="h-px bg-border-hairline" />
        <ul className="space-y-2 text-body-sm text-text-primary">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
            Tu carpeta tributaria y laboral siguen vigentes
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
            Tu DICOM se actualiza automáticamente
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-accent flex-shrink-0 mt-0.5" />
            Solo necesitamos los antecedentes del nuevo inmueble
          </li>
        </ul>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Más tarde
        </button>
        <button
          onClick={() => {
            alert('Iniciamos una nueva operación. Tu ejecutiva Camila Reinoso te contactará para coordinar.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Iniciar nueva operación
        </button>
      </div>
    </ModalShell>
  );
}

function CompartirAccesoModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [vigencia, setVigencia] = useState<'7' | '14' | '30'>('14');
  const [generated, setGenerated] = useState<string | null>(null);

  function generateLink() {
    const token = Math.random().toString(36).substring(2, 12);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setGenerated(`${baseUrl}/cliente/mi-inmueble?shared=1&t=${token}`);
  }

  return (
    <ModalShell
      kicker="Compartir bóveda"
      title="Generar acceso temporal"
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      {!generated ? (
        <>
          <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
            Comparte una vista de tu bóveda con tu abogado, asesor inmobiliario o
            cualquier persona que necesite ver los documentos. El acceso es de solo
            lectura y caduca automáticamente.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2 block">
                Email del destinatario
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abogado@ejemplo.cl"
                className="w-full p-2 text-body-sm border border-border-hairline bg-bg-card focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2 block">
                Vigencia del enlace
              </label>
              <div className="flex gap-2">
                {(['7', '14', '30'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setVigencia(d)}
                    className={cn(
                      'px-4 py-2 text-body-sm border transition-colors',
                      vigencia === d
                        ? 'border-accent bg-accent text-text-inverse'
                        : 'border-border-hairline hover:bg-bg-page',
                    )}
                  >
                    {d} días
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
              Cancelar
            </button>
            <button
              onClick={generateLink}
              disabled={!email.includes('@')}
              className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar enlace
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="border border-status-success bg-status-success-bg/40 p-4 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-status-success flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-body-sm font-semibold text-text-primary">
                  Enlace generado
                </div>
                <div className="text-caption text-text-secondary mt-0.5">
                  Vigente por {vigencia} días · Notificación enviada a {email}
                </div>
              </div>
            </div>
          </div>
          <div className="border border-border-hairline bg-bg-page p-3 mb-3">
            <div className="text-caption text-text-muted mb-1">Enlace de acceso</div>
            <div className="flex items-center gap-2">
              <LinkIcon size={12} className="text-text-muted flex-shrink-0" />
              <input
                readOnly
                value={generated}
                className="flex-1 text-caption bg-transparent text-text-primary focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(generated);
                  alert('Enlace copiado al portapapeles.');
                }}
                className="text-caption text-accent hover:underline whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
          <a
            href={generated}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-body-sm text-accent hover:underline"
          >
            <ExternalLink size={12} />
            Previsualizar como destinatario
          </a>
          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-text-primary text-text-inverse text-body-sm font-medium hover:bg-accent"
            >
              Listo
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function ReemisionModal({
  docs,
  onClose,
  viewer,
}: {
  docs: CustodiaDoc[];
  onClose: () => void;
  viewer: ViewerMode;
}) {
  const [selected, setSelected] = useState<string[]>(docs.map((d) => d.id));
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const isEjecutivo = viewer === 'ejecutivo';

  return (
    <ModalShell
      kicker="Bóveda documental"
      title="Solicitar reemisión de documentos"
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        {isEjecutivo
          ? 'Selecciona los certificados que quieres gestionar en nombre del cliente. La reemisión queda registrada en su bóveda.'
          : 'Selecciona los certificados que necesitas reemitir. Los solicitamos por ti al organismo emisor.'}
      </p>
      <ul className="space-y-2 mb-4">
        {docs.map((d) => (
          <li key={d.id} className="border border-border-hairline bg-bg-page p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(d.id)}
                onChange={() => toggle(d.id)}
                className="mt-1 accent-accent"
              />
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium text-text-primary">
                  {d.name}
                </div>
                <div className="text-caption text-text-muted mt-0.5">
                  Emitido el {formatDate(d.date)} · {d.author}
                </div>
              </div>
            </label>
          </li>
        ))}
      </ul>
      <div className="text-caption text-text-muted leading-relaxed mb-4">
        Los nuevos certificados quedarán disponibles en tu bóveda en un plazo de 3 a 5
        días hábiles. Te avisaremos cuando estén listos.
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Cancelar
        </button>
        <button
          onClick={() => {
            alert(
              `Solicitud de reemisión iniciada para ${selected.length} documento(s). Te notificaremos cuando estén disponibles.`,
            );
            onClose();
          }}
          disabled={selected.length === 0}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Solicitar {selected.length > 0 ? `(${selected.length})` : ''}
        </button>
      </div>
    </ModalShell>
  );
}

function OfertaRefiModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell kicker="Acción del banco" title="Generar oferta de refinanciamiento" onClose={onClose}>
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        Generá una propuesta personalizada de refinanciamiento basada en el saldo
        deudor actual del cliente y las tasas vigentes.
      </p>
      <div className="border border-border-hairline bg-bg-page p-4 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Saldo deudor actual</span>
          <span className="text-body-sm font-semibold tabular-nums">UF 4.720</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Tasa propuesta</span>
          <span className="text-body-sm font-semibold text-accent tabular-nums">4,15% UF</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Ahorro proyectado para el cliente</span>
          <span className="text-body-sm font-semibold tabular-nums">UF 980</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-muted">Margen para el banco</span>
          <span className="text-body-sm font-semibold tabular-nums">+ UF 142 / año</span>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Cancelar
        </button>
        <button
          onClick={() => {
            alert('Oferta enviada al cliente. Aparecerá en su bóveda con vigencia de 30 días.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Enviar oferta
        </button>
      </div>
    </ModalShell>
  );
}

function PreaprobarModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell kicker="Acción del banco" title="Pre-aprobar nueva hipoteca" onClose={onClose}>
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        El historial del cliente permite calcular una pre-aprobación express para su
        próxima operación inmobiliaria.
      </p>
      <div className="border border-border-hairline bg-bg-page p-4 space-y-3">
        <div>
          <div className="text-caption text-text-muted">Monto pre-aprobado</div>
          <div className="text-h3 font-semibold text-accent mt-1">UF 5.200</div>
        </div>
        <div className="h-px bg-border-hairline" />
        <ul className="text-caption text-text-secondary space-y-1">
          <li>Pagos al día durante 5 períodos</li>
          <li>Carpeta tributaria reciente</li>
          <li>Sin observaciones en DICOM</li>
          <li>Capacidad de pago vigente</li>
        </ul>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Cancelar
        </button>
        <button
          onClick={() => {
            alert('Pre-aprobación notificada al cliente. Vigencia: 60 días.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Notificar al cliente
        </button>
      </div>
    </ModalShell>
  );
}

function CrossSellModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell kicker="Acción del banco" title="Marcar como prospecto cross-sell" onClose={onClose}>
      <p className="text-body-sm text-text-secondary leading-relaxed mb-4">
        Suma este cliente a campañas activas. Las recomendaciones se basan en su
        perfil financiero y comportamiento histórico.
      </p>
      <div className="space-y-3">
        <label className="flex items-start gap-3 p-3 border border-border-hairline cursor-pointer hover:bg-bg-page">
          <input type="checkbox" defaultChecked className="mt-1 accent-accent" />
          <div>
            <div className="text-body-sm font-medium text-text-primary">
              Cuenta Corriente Premium
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              Match alto · Cliente con ingreso estable y operación activa
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 border border-border-hairline cursor-pointer hover:bg-bg-page">
          <input type="checkbox" className="mt-1 accent-accent" />
          <div>
            <div className="text-body-sm font-medium text-text-primary">
              Inversión gestionada
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              Match medio · Requiere conversación de descubrimiento
            </div>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 border border-border-hairline cursor-pointer hover:bg-bg-page">
          <input type="checkbox" className="mt-1 accent-accent" />
          <div>
            <div className="text-body-sm font-medium text-text-primary">
              Seguro hogar {BRAND.shortName}
            </div>
            <div className="text-caption text-text-secondary mt-0.5">
              Match alto · No tiene seguro contratado con nosotros
            </div>
          </div>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">
          Cancelar
        </button>
        <button
          onClick={() => {
            alert('Cliente añadido a las campañas seleccionadas.');
            onClose();
          }}
          className="px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted"
        >
          Confirmar
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
