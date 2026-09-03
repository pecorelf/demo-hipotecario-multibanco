import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  FileText,
  Home,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import {
  ACTOR_LABEL,
  activeRepairsForActor,
  docsByTrack,
  notificationsForActor,
  trackProgress,
  unreadCount,
  usePostApprovalStore,
  type Actor,
  type DocStatus,
  type OperationDoc,
  type PropertyType,
  type ScriptedOutcome,
  type TrackKey,
} from '@/store/postApprovalStore';
import { BRAND } from '@/lib/brand';

/**
 * ClienteSeguimiento — la nueva pantalla principal del POC.
 *
 * Modela el momento POST-APROBACIÓN de la hipoteca: el cliente entra
 * al portal y ve su operación en marcha, con dos tracks paralelos
 * (Estudio de Títulos + Carpeta Comercial), gate de pago de gastos
 * operacionales, y notificaciones con acción.
 *
 * Es lo que Carolina pidió: el foco "desde que la solicitud está
 * aprobada en adelante".
 */
export default function ClienteSeguimiento() {
  const navigate = useNavigate();
  const {
    propertyType,
    caseRef,
    propertyAddress,
    propertyValueUF,
    loanAmountUF,
    buyerName,
    sellerName,
    inmobiliariaName,
    ejecutivoName,
    docs,
    notifications,
    gastosOperacionalesUF,
    gastosOperacionalesPaid,
    payGastos,
    uploadDoc,
    resolveRepair,
    resetOperation,
  } = usePostApprovalStore();

  const setRole = useAppStore((st) => st.setRole);
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiReviewDocId, setAiReviewDocId] = useState<string | null>(null);

  // First name of buyer for greeting
  const firstName = buyerName.split(' ')[0];

  // Progresos por track
  const titulosPct = trackProgress(docs, 'titulos');
  const tasacionPct = trackProgress(docs, 'tasacion');
  const comercialPct = trackProgress(docs, 'comercial');

  // Notificaciones para el comprador
  const myNotifications = notificationsForActor(notifications, 'comprador');
  const myUnread = unreadCount(notifications, 'comprador');

  // Reparos activos para el comprador
  const myActiveRepairs = activeRepairsForActor(docs, 'comprador');

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-12">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6 max-w-4xl">
        <div>
          <Kicker>Tu hipoteca · Caso #{caseRef}</Kicker>
          <PageTitle className="mt-3">
            Hola {firstName}, tu hipoteca fue aprobada.
          </PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 leading-relaxed max-w-measure">
            Acá puedes ver el avance de tu operación, subir los documentos
            pendientes y resolver cualquier reparo que aparezca.
          </p>
        </div>

        {/* Campana */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative flex-shrink-0 w-11 h-11 inline-flex items-center justify-center border border-border-hairline bg-bg-card hover:border-text-primary transition-colors"
        >
          <Bell size={18} className="text-text-primary" />
          {myUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-accent text-text-inverse text-[10px] font-semibold rounded-full">
              {myUnread}
            </span>
          )}
        </button>
      </div>

      <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />

      {/* CONTEXTO DE LA OPERACIÓN */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl">
        <ContextField label="Propiedad" value={propertyAddress} icon={<Home size={14} />} />
        <ContextField
          label="Valor / Crédito"
          value={`UF ${propertyValueUF.toLocaleString('es-CL')}`}
          sub={`Crédito UF ${loanAmountUF.toLocaleString('es-CL')}`}
        />
        <ContextField
          label={propertyType === 'usada' ? 'Vendedor' : 'Inmobiliaria'}
          value={propertyType === 'usada' ? sellerName : inmobiliariaName}
          icon={propertyType === 'usada' ? <FileText size={14} /> : <Building2 size={14} />}
        />
        <ContextField label="Tu ejecutiva" value={ejecutivoName} />
      </section>

      {/* REPAROS ACTIVOS — banner protagonista si los hay */}
      {myActiveRepairs.length > 0 && (
        <section className="mt-10 max-w-4xl">
          <div className="border-l-4 border-status-error bg-status-error-bg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-body font-semibold text-status-error">
                  {myActiveRepairs.length === 1
                    ? 'Tienes 1 reparo pendiente'
                    : `Tienes ${myActiveRepairs.length} reparos pendientes`}
                </div>
                <p className="text-body-sm text-text-primary mt-1">
                  Para que tu operación avance, resuelve los reparos abajo subiendo
                  los documentos corregidos.
                </p>
                {/* Retorno al otro extremo del ciclo. Permite mostrar en la
                    demostración cómo el mismo reparo se ve desde el banco. */}
                <Link
                  to="/ejecutivo"
                  onClick={() => setRole('ejecutivo')}
                  className="inline-block mt-3 text-body-sm text-accent hover:underline"
                >
                  Ver este caso desde el banco
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GATE DE PAGO DE GASTOS OPERACIONALES */}
      {!gastosOperacionalesPaid && (
        <section className="mt-10 max-w-4xl">
          <div className={cn(
            'border border-border-hairline bg-bg-card p-6',
            'flex items-start gap-5',
          )}>
            <div className="flex-shrink-0 w-11 h-11 inline-flex items-center justify-center bg-accent text-text-inverse">
              <CreditCard size={18} />
            </div>
            <div className="flex-1">
              <Kicker tone="muted">Antes de avanzar</Kicker>
              <h3 className="text-h3 text-text-primary font-semibold mt-1">
                Paga los gastos operacionales
              </h3>
              <p className="text-body text-text-secondary mt-2 leading-relaxed max-w-measure">
                Para iniciar el estudio de títulos de tu propiedad necesitamos
                que pagues UF {gastosOperacionalesUF} de gastos operacionales.
                Este pago incluye los certificados del CBR, notaría e impuestos
                de inscripción.
              </p>
              <button
                onClick={() => {
                  payGastos();
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-text-inverse text-body font-medium hover:bg-accent-muted transition-colors"
              >
                Pagar UF {gastosOperacionalesUF} ahora
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TRACKS PARALELOS */}
      <section className="mt-12">
        <h2 className="text-h2 font-semibold text-text-primary">
          Estado de tu operación
        </h2>
        <p className="text-body text-text-secondary mt-2 max-w-3xl">
          Tu hipoteca avanza por tres vías en paralelo. Las tres tienen que
          llegar al 100% para que pasemos a escrituración.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <TrackCard
            title="Estudio de Títulos"
            description={
              propertyType === 'usada'
                ? 'Documentos legales de la propiedad. Los provee el vendedor o la vendedora.'
                : 'Documentos legales del proyecto. Los provee la inmobiliaria.'
            }
            progressPct={titulosPct}
            docs={docsByTrack(docs, 'titulos')}
            track="titulos"
            blocked={!gastosOperacionalesPaid}
            blockedMessage="Paga los gastos operacionales para iniciar el estudio de títulos."
            onUploadClick={(id) => setAiReviewDocId(id)}
            onResolveRepair={(id) => resolveRepair(id, 'comprador')}
            viewerActor="comprador"
            allowCrossUpload
          />
          <TrackCard
            title="Tasación"
            description="Valoración técnica de la propiedad. La gestiona el banco con un perito."
            progressPct={tasacionPct}
            docs={docsByTrack(docs, 'tasacion')}
            track="tasacion"
            blocked={!gastosOperacionalesPaid}
            blockedMessage="Paga los gastos operacionales para iniciar la tasación."
            onUploadClick={(id) => setAiReviewDocId(id)}
            onResolveRepair={(id) => resolveRepair(id, 'comprador')}
            viewerActor="comprador"
          />
          <TrackCard
            title="Carpeta Comercial"
            description="Documentos para evaluar tu perfil crediticio. Los provees tú."
            progressPct={comercialPct}
            docs={docsByTrack(docs, 'comercial')}
            track="comercial"
            blocked={false}
            onUploadClick={(id) => setAiReviewDocId(id)}
            onResolveRepair={(id) => resolveRepair(id, 'comprador')}
            viewerActor="comprador"
          />
        </div>
      </section>

      {/* MODAL DE REVISIÓN IA */}
      {aiReviewDocId && (
        <AIReviewModal
          doc={docs.find((d) => d.id === aiReviewDocId)!}
          onComplete={(action) => {
            if (action === 'upload' && aiReviewDocId) {
              const doc = docs.find((d) => d.id === aiReviewDocId);
              if (doc?.status === 'con_reparo') {
                resolveRepair(aiReviewDocId, 'comprador');
              } else {
                uploadDoc(aiReviewDocId, 'comprador');
              }
            }
            setAiReviewDocId(null);
          }}
        />
      )}

      {/* ACCIONES ADICIONALES — al final de la vista */}
      <section className="mt-16 pt-10 border-t border-border-hairline max-w-4xl">
        <Kicker tone="muted">El POC incluye más vistas</Kicker>
        <h3 className="text-h3 font-semibold text-text-primary mt-2">
          ¿Quieres explorar otra parte del proceso?
        </h3>
        <p className="text-body text-text-secondary mt-2 leading-relaxed max-w-measure">
          Esta es la vista principal del cliente. Hay vistas complementarias
          del lado del cliente, del banco y un catálogo completo con las 17
          vistas del POC.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CARD 1 — Cliente: vistas complementarias */}
          <button
            onClick={() => navigate('/cliente/credito')}
            className="group text-left p-5 border border-border-hairline bg-bg-card hover:border-text-primary hover:shadow-soft transition-all"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-text-primary text-text-inverse mb-3 group-hover:scale-105 transition-transform">
              <FileText size={16} />
            </div>
            <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-1">
              Cliente · Más vistas
            </div>
            <div className="text-body font-semibold text-text-primary">
              Detalle del crédito
            </div>
            <div className="text-body-sm text-text-secondary mt-1.5 leading-relaxed">
              Condiciones, escenarios, línea de tiempo de 7 etapas y
              stepper del proceso completo.
            </div>
          </button>

          {/* CARD 2 — Banco: vistas internas */}
          <button
            onClick={() => navigate('/ejecutivo')}
            className="group text-left p-5 border border-border-hairline bg-bg-card hover:border-text-primary hover:shadow-soft transition-all"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-text-primary text-text-inverse mb-3 group-hover:scale-105 transition-transform">
              <Building2 size={16} />
            </div>
            <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-1">
              Banco · Vistas internas
            </div>
            <div className="text-body font-semibold text-text-primary">
              Cockpit del ejecutivo
            </div>
            <div className="text-body-sm text-text-secondary mt-1.5 leading-relaxed">
              Lo que ve la ejecutiva del banco. Panel para aprobar
              documentos o lanzar reparos al cliente, vendedor o
              inmobiliaria.
            </div>
          </button>

          {/* CARD 3 — Catálogo completo */}
          <button
            onClick={() => navigate('/portal')}
            className="group text-left p-5 border border-border-hairline bg-bg-card hover:border-text-primary hover:shadow-soft transition-all"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-accent text-text-inverse mb-3 group-hover:scale-105 transition-transform">
              <Compass size={16} />
            </div>
            <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-1">
              Las 17 vistas
            </div>
            <div className="text-body font-semibold text-text-primary">
              Catálogo completo
            </div>
            <div className="text-body-sm text-text-secondary mt-1.5 leading-relaxed">
              Todas las vistas organizadas por rol: cliente, ejecutivo,
              back office, vendedor, inmobiliaria, gobierno.
            </div>
          </button>
        </div>

        {/* Acción secundaria: iniciar simulación */}
        <div className="mt-6">
          <button
            onClick={() => {
              resetOperation();
              navigate('/cliente/simulacion-pre');
            }}
            className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-accent transition-colors"
          >
            <Sparkles size={14} />
            Iniciar una simulación nueva con {BRAND.assistantName} (extra-agregado pre-aprobación)
            <ChevronRight size={12} />
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS DRAWER */}
      {notifOpen && (
        <NotificationsDrawer
          notifications={myNotifications}
          onClose={() => setNotifOpen(false)}
          onNavigate={(link) => {
            setNotifOpen(false);
            if (link) navigate(link);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────

function ContextField({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-1.5 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-body text-text-primary font-medium leading-tight">
        {value}
      </div>
      {sub && (
        <div className="text-caption text-text-secondary mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function TrackCard({
  title,
  description,
  progressPct,
  docs,
  blocked,
  blockedMessage,
  onUploadClick,
  onResolveRepair,
  viewerActor,
  allowCrossUpload,
}: {
  title: string;
  description: string;
  progressPct: number;
  docs: OperationDoc[];
  track: TrackKey;
  blocked: boolean;
  blockedMessage?: string;
  onUploadClick: (id: string) => void;
  onResolveRepair: (id: string) => void;
  viewerActor: Actor;
  allowCrossUpload?: boolean;
}) {
  return (
    <div className="border border-border-hairline bg-bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
          <p className="text-body-sm text-text-secondary mt-1.5">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-h2 text-text-primary tabular-nums leading-none">
            {progressPct}%
          </div>
          <div className="text-caption text-text-muted uppercase tracking-[0.1em] mt-1">
            Avance
          </div>
        </div>
      </div>

      <div className="mt-5 h-1.5 bg-bg-sunken">
        <div
          className="h-full bg-accent transition-all duration-base"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {blocked && blockedMessage && (
        <div className="mt-5 p-3 bg-status-warning-bg border-l-2 border-status-warning">
          <div className="text-body-sm text-text-primary">{blockedMessage}</div>
        </div>
      )}

      <ul className={cn('mt-6 space-y-3', blocked && 'opacity-60 pointer-events-none')}>
        {docs.map((d) => (
          <DocRow
            key={d.id}
            doc={d}
            viewerActor={viewerActor}
            allowCrossUpload={allowCrossUpload}
            onClickAction={() => onUploadClick(d.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function DocRow({
  doc,
  onClickAction,
  viewerActor,
  allowCrossUpload,
}: {
  doc: OperationDoc;
  onClickAction: () => void;
  viewerActor: Actor;
  allowCrossUpload?: boolean;
}) {
  const isOwnResponsibility = doc.responsible === viewerActor;
  const canActOnBehalf =
    !!allowCrossUpload &&
    !isOwnResponsibility &&
    doc.responsible !== 'ejecutivo';
  const actionable =
    (isOwnResponsibility || canActOnBehalf) &&
    (doc.status === 'pendiente' || doc.status === 'con_reparo');

  const responsibleInclusive =
    doc.responsible === 'vendedor'
      ? 'el vendedor o la vendedora'
      : doc.responsible === 'inmobiliaria'
      ? 'la inmobiliaria'
      : ACTOR_LABEL[doc.responsible].toLowerCase();

  return (
    <li className="border border-border-hairline bg-bg-page p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <StatusIcon status={doc.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-body-sm font-medium text-text-primary">
              {doc.name}
            </div>
            {doc.optional && (
              <Pill variant="default" size="sm">Opcional</Pill>
            )}
            {!isOwnResponsibility && (
              <Pill variant="default" size="sm">
                Responsabilidad: {ACTOR_LABEL[doc.responsible]}
              </Pill>
            )}
          </div>
          <p className="text-caption text-text-secondary mt-1 leading-relaxed">
            {doc.description}
          </p>

          {doc.uploadedByName && (doc.status === 'en_validacion' || doc.status === 'validado') && (
            <div className="mt-2 text-caption text-text-muted">
              Subido por {doc.uploadedByName}
              {doc.uploadedBy && doc.uploadedBy !== doc.responsible && (
                <span> · en nombre de {responsibleInclusive}</span>
              )}
            </div>
          )}

          {doc.status === 'con_reparo' && doc.repairReason && (
            <div className="mt-3 p-3 bg-status-error-bg border-l-2 border-status-error">
              <div className="text-caption uppercase tracking-[0.1em] text-status-error font-semibold mb-1">
                Reparo
              </div>
              <div className="text-body-sm text-text-primary leading-relaxed">
                {doc.repairReason}
              </div>
            </div>
          )}

          {actionable && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <button
                onClick={onClickAction}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-text-primary text-text-inverse text-body-sm font-medium hover:bg-accent transition-colors"
              >
                <Upload size={12} />
                {doc.status === 'con_reparo' ? 'Resubir corregido' : 'Subir documento'}
              </button>
              {canActOnBehalf && (
                <span className="text-caption text-text-muted">
                  Puedes subirlo tú, si {responsibleInclusive} no lo tiene a la mano.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: DocStatus }) {
  if (status === 'validado') {
    return (
      <div className="w-7 h-7 flex items-center justify-center bg-status-success text-text-inverse">
        <Check size={14} />
      </div>
    );
  }
  if (status === 'con_reparo') {
    return (
      <div className="w-7 h-7 flex items-center justify-center bg-status-error text-text-inverse">
        <X size={14} />
      </div>
    );
  }
  if (status === 'en_validacion') {
    return (
      <div className="w-7 h-7 flex items-center justify-center bg-status-info text-text-inverse">
        <Clock size={14} />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 flex items-center justify-center border border-border-hairline text-text-muted">
      <FileText size={14} />
    </div>
  );
}

function NotificationsDrawer({
  notifications,
  onClose,
  onNavigate,
}: {
  notifications: ReturnType<typeof notificationsForActor>;
  onClose: () => void;
  onNavigate: (link?: string) => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-text-primary/40 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-bg-card border-l border-border-hairline z-50 overflow-y-auto">
        <div className="p-6 border-b border-border-hairline flex items-center justify-between">
          <div>
            <Kicker>Notificaciones</Kicker>
            <h3 className="text-h3 font-semibold text-text-primary mt-1">
              Tu operación
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-bg-sunken">
            <X size={16} />
          </button>
        </div>
        <ul className="divide-y divide-border-hairline">
          {notifications.length === 0 ? (
            <li className="p-8 text-center text-text-muted text-body-sm">
              No tienes notificaciones por ahora.
            </li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'p-5',
                  !n.read && 'bg-status-info-bg/30',
                )}
                onClick={() => onNavigate(n.link)}
              >
                <div className="flex items-start gap-3 cursor-pointer">
                  <div className="flex-shrink-0 mt-1">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-semibold text-text-primary">
                      {n.title}
                    </div>
                    <div className="text-body-sm text-text-secondary mt-1 leading-relaxed">
                      {n.body}
                    </div>
                    <div className="text-caption text-text-muted mt-2">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'reparo') return <AlertCircle size={16} className="text-status-error" />;
  if (type === 'pago_pendiente') return <CreditCard size={16} className="text-accent" />;
  if (type === 'avance') return <CheckCircle2 size={16} className="text-status-success" />;
  if (type === 'documento_subido') return <Upload size={16} className="text-status-info" />;
  if (type === 'reparo_resuelto') return <Sparkles size={16} className="text-status-success" />;
  return <Bell size={16} className="text-text-muted" />;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}


// ─────────────────────────────────────────────────────────────
// AIReviewModal — simula análisis IA al subir un documento.
// 3 outcomes scripted: validado / con_observacion / no_coincide.
// ─────────────────────────────────────────────────────────────

interface AIReviewModalProps {
  doc: OperationDoc;
  onComplete: (action: 'upload' | 'cancel') => void;
}

type ReviewPhase = 'picker' | 'analyzing' | 'result';

function AIReviewModal({ doc, onComplete }: AIReviewModalProps) {
  const [phase, setPhase] = useState<ReviewPhase>('picker');
  const [step, setStep] = useState(0);
  const STEPS = ['Leyendo documento', 'Identificando tipo', 'Extrayendo campos clave', 'Validando contra requisitos'];

  useEffect(() => {
    if (phase !== 'analyzing') return;
    setStep(0);
    const i = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), 600);
    const t = window.setTimeout(() => setPhase('result'), 2400);
    return () => { window.clearInterval(i); window.clearTimeout(t); };
  }, [phase]);

  const outcome = doc.scriptedOutcome;

  return (
    <>
      <div className="fixed inset-0 bg-text-primary/40 z-50" onClick={() => onComplete('cancel')} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
        <div className="bg-bg-card border border-border-hairline shadow-lifted max-w-lg w-full pointer-events-auto">
          <div className="px-6 py-4 border-b border-border-hairline flex items-center justify-between">
            <div>
              <div className="text-caption uppercase tracking-[0.1em] text-text-muted">
                {phase === 'picker' && 'Subir documento'}
                {phase === 'analyzing' && 'Revisando con IA'}
                {phase === 'result' && 'Resultado del análisis'}
              </div>
              <div className="text-body font-semibold text-text-primary mt-0.5">{doc.name}</div>
            </div>
            <button onClick={() => onComplete('cancel')} className="w-8 h-8 inline-flex items-center justify-center hover:bg-bg-sunken" aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
          <div className="px-6 py-6">
            {phase === 'picker' && (
              <div>
                <button onClick={() => setPhase('analyzing')} className="w-full border-2 border-dashed border-border-hairline hover:border-accent hover:bg-bg-page transition-colors py-12 px-6 text-center group">
                  <Upload size={24} className="text-text-muted group-hover:text-accent mx-auto mb-3 transition-colors" />
                  <div className="text-body font-medium text-text-primary">Selecciona el documento</div>
                  <div className="text-caption text-text-muted mt-1">PDF, JPG o PNG. Máximo 10 MB.</div>
                </button>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => onComplete('cancel')} className="text-body-sm text-text-secondary hover:text-text-primary">Cancelar</button>
                </div>
              </div>
            )}
            {phase === 'analyzing' && (
              <div>
                <div className="text-body text-text-secondary mb-5">Estoy revisando el documento y extrayendo la información…</div>
                <ul className="space-y-3">
                  {STEPS.map((s, i) => {
                    const isDone = i < step;
                    const isActive = i === step;
                    return (
                      <li key={s} className="flex items-center gap-3">
                        <div className={cn('w-5 h-5 flex-shrink-0 inline-flex items-center justify-center transition-colors', isDone ? 'bg-status-success text-text-inverse' : 'border border-border-hairline')}>
                          {isDone ? <Check size={12} /> : isActive ? <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> : null}
                        </div>
                        <span className={cn('text-body-sm', isDone ? 'text-text-primary' : isActive ? 'text-text-primary font-medium' : 'text-text-muted')}>{s}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {phase === 'result' && outcome && <ResultStep outcome={outcome} onComplete={onComplete} onRetry={() => setPhase('picker')} />}
          </div>
        </div>
      </div>
    </>
  );
}

function ResultStep({ outcome, onComplete, onRetry }: { outcome: ScriptedOutcome; onComplete: (a: 'upload' | 'cancel') => void; onRetry: () => void }) {
  if (outcome.kind === 'validado') {
    return (
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 inline-flex items-center justify-center bg-status-success text-text-inverse flex-shrink-0"><Check size={16} strokeWidth={2.5} /></div>
          <div>
            <div className="text-body font-semibold text-text-primary">Documento validado</div>
            <div className="text-body-sm text-text-secondary mt-0.5">Coincide con los requisitos. Continúa con tu operación.</div>
          </div>
        </div>
        <ExtractedFields fields={outcome.extractedFields} />
        <div className="mt-5 flex justify-end">
          <button onClick={() => onComplete('upload')} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted">
            Continuar <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }
  if (outcome.kind === 'con_observacion') {
    return (
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 inline-flex items-center justify-center bg-status-warning text-text-inverse flex-shrink-0"><AlertCircle size={16} /></div>
          <div>
            <div className="text-body font-semibold text-text-primary">Documento detectado, con observaciones</div>
            <div className="text-body-sm text-text-secondary mt-1 leading-relaxed">{outcome.reason}</div>
          </div>
        </div>
        {outcome.extractedFields && <ExtractedFields fields={outcome.extractedFields} />}
        <div className="mt-5 flex justify-end gap-2 flex-wrap">
          <button onClick={onRetry} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">Subir versión nítida</button>
          <button onClick={() => onComplete('upload')} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted">Optimizar y enviar</button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 inline-flex items-center justify-center bg-status-error text-text-inverse flex-shrink-0"><X size={16} strokeWidth={2.5} /></div>
        <div>
          <div className="text-body font-semibold text-text-primary">El documento no coincide</div>
          <div className="text-body-sm text-text-secondary mt-1 leading-relaxed">Son documentos distintos. Puedes intentar subir el correcto o pedirle ayuda a tu ejecutiva.</div>
        </div>
      </div>
      <div className="border border-border-hairline bg-bg-page p-4 space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-caption uppercase tracking-[0.1em] text-text-muted min-w-[80px]">Esperaba</span>
          <span className="text-body-sm text-text-primary">{outcome.expected}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-caption uppercase tracking-[0.1em] text-text-muted min-w-[80px]">Detecté</span>
          <span className="text-body-sm text-text-primary">{outcome.detected}</span>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2 flex-wrap">
        <button onClick={() => onComplete('cancel')} className="px-4 py-2 border border-border-hairline text-body-sm hover:bg-bg-page">Pedir ayuda al ejecutivo</button>
        <button onClick={onRetry} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-inverse text-body-sm font-medium hover:bg-accent-muted">Subir el correcto</button>
      </div>
    </div>
  );
}

function ExtractedFields({ fields }: { fields: Record<string, string> }) {
  return (
    <div className="border border-border-hairline bg-bg-page p-4 space-y-1.5">
      <div className="text-caption uppercase tracking-[0.1em] text-text-muted mb-2">Datos extraídos</div>
      {Object.entries(fields).map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-3">
          <span className="text-caption text-text-muted min-w-[140px] flex-shrink-0">{k}</span>
          <span className="text-body-sm text-text-primary">{v}</span>
        </div>
      ))}
    </div>
  );
}
