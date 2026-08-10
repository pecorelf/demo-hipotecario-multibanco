import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Check,
  Clock,
  FileText,
  Home,
  Upload,
  X,
} from 'lucide-react';
import { Kicker, PageTitle, Pill } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  activeRepairsForActor,
  docsByTrack,
  notificationsForActor,
  unreadCount,
  usePostApprovalStore,
  type DocStatus,
  type OperationDoc,
} from '@/store/postApprovalStore';
import { BRAND } from '@/lib/brand';

/**
 * Portal del Vendedor.
 *
 * El vendedor entra acá para subir los documentos legales de la
 * propiedad usada que está vendiendo (Estudio de Títulos).
 *
 * Solo aplicable si propertyType = 'usada'. Si es 'nueva', estos
 * documentos los gestiona la inmobiliaria (ver /inmobiliaria/proyectos).
 */
export default function VendedorPortal() {
  const navigate = useNavigate();
  const {
    propertyType,
    propertyAddress,
    buyerName,
    sellerName,
    docs,
    notifications,
    uploadDoc,
    resolveRepair,
  } = usePostApprovalStore();

  const [notifOpen, setNotifOpen] = useState(false);

  // Solo documentos del vendedor (estudio de títulos, propiedad usada)
  const myDocs = docsByTrack(docs, 'titulos').filter(
    (d) => d.responsible === 'vendedor',
  );
  const myRepairs = activeRepairsForActor(docs, 'vendedor');
  const myNotifications = notificationsForActor(notifications, 'vendedor');
  const myUnread = unreadCount(notifications, 'vendedor');

  const sellerFirstName = sellerName.split(' ')[0];
  const buyerFirstName = buyerName.split(' ')[0];

  // Si la propiedad es nueva, mostrar mensaje aclarativo
  if (propertyType === 'nueva') {
    return (
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16">
        <div className="max-w-2xl">
          <Kicker>Portal del Vendedor</Kicker>
          <PageTitle className="mt-3">No aplicable a propiedades nuevas</PageTitle>
          <p className="text-body-lg text-text-secondary mt-4 leading-relaxed">
            Esta operación es una propiedad nueva, por lo que los documentos del
            inmueble los gestiona la inmobiliaria. Cambia el tipo de propiedad
            a <strong>Usada</strong> en la vista del cliente para ver este flujo.
          </p>
          <button
            onClick={() => navigate('/cliente/seguimiento')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-text-inverse text-body font-medium hover:bg-accent transition-colors"
          >
            Ir a vista del cliente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-12">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6 max-w-4xl">
        <div>
          <Kicker>Portal del Vendedor</Kicker>
          <PageTitle className="mt-3">
            Hola {sellerFirstName}. Hipoteca de {buyerFirstName} en proceso.
          </PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 leading-relaxed max-w-measure">
            {buyerFirstName} está comprando tu propiedad con un crédito en
            {BRAND.shortName}. Para que el banco pueda continuar, necesitamos estos
            documentos legales tuyos. Súbelos acá directo.
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

      {/* Contexto propiedad */}
      <section className="mt-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
          <Home size={14} />
          <span>{propertyAddress}</span>
        </div>
      </section>

      {/* REPAROS ACTIVOS — banner si los hay */}
      {myRepairs.length > 0 && (
        <section className="mt-8 max-w-4xl">
          <div className="border-l-4 border-status-error bg-status-error-bg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-body font-semibold text-status-error">
                  {myRepairs.length === 1
                    ? 'Tienes 1 reparo pendiente'
                    : `Tienes ${myRepairs.length} reparos pendientes`}
                </div>
                <p className="text-body-sm text-text-primary mt-1">
                  El banco encontró observaciones en los documentos que subiste.
                  Revisalos abajo y resubilos corregidos para que la operación
                  pueda avanzar.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DOCUMENTOS */}
      <section className="mt-10 max-w-4xl">
        <h2 className="text-h2 font-semibold text-text-primary">
          Documentos requeridos
        </h2>
        <p className="text-body text-text-secondary mt-2">
          Estos son los documentos legales que el banco necesita para hacer el
          estudio de títulos de tu propiedad.
        </p>

        <ul className="mt-8 space-y-3">
          {myDocs.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              onUpload={() => uploadDoc(d.id)}
              onResolve={() => resolveRepair(d.id)}
            />
          ))}
        </ul>
      </section>

      {/* NOTIFICATIONS DRAWER */}
      {notifOpen && (
        <NotificationsDrawer
          notifications={myNotifications}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function DocRow({
  doc,
  onUpload,
  onResolve,
}: {
  doc: OperationDoc;
  onUpload: () => void;
  onResolve: () => void;
}) {
  const actionable = doc.status === 'pendiente' || doc.status === 'con_reparo';

  return (
    <li className="border border-border-hairline bg-bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <StatusIcon status={doc.status} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-body-sm font-medium text-text-primary">
              {doc.name}
            </div>
            {doc.optional && <Pill variant="default" size="sm">Opcional</Pill>}
          </div>
          <p className="text-caption text-text-secondary mt-1 leading-relaxed">
            {doc.description}
          </p>

          {doc.status === 'con_reparo' && doc.repairReason && (
            <div className="mt-3 p-3 bg-status-error-bg border-l-2 border-status-error">
              <div className="text-caption uppercase tracking-[0.1em] text-status-error font-semibold mb-1">
                Reparo del banco
              </div>
              <div className="text-body-sm text-text-primary leading-relaxed">
                {doc.repairReason}
              </div>
            </div>
          )}

          {actionable && (
            <button
              onClick={doc.status === 'con_reparo' ? onResolve : onUpload}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-text-primary text-text-inverse text-body-sm font-medium hover:bg-accent transition-colors"
            >
              <Upload size={12} />
              {doc.status === 'con_reparo' ? 'Resubir corregido' : 'Subir documento'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: DocStatus }) {
  if (status === 'validado') {
    return <div className="w-7 h-7 flex items-center justify-center bg-status-success text-text-inverse"><Check size={14} /></div>;
  }
  if (status === 'con_reparo') {
    return <div className="w-7 h-7 flex items-center justify-center bg-status-error text-text-inverse"><X size={14} /></div>;
  }
  if (status === 'en_validacion') {
    return <div className="w-7 h-7 flex items-center justify-center bg-status-info text-text-inverse"><Clock size={14} /></div>;
  }
  return <div className="w-7 h-7 flex items-center justify-center border border-border-hairline text-text-muted"><FileText size={14} /></div>;
}

function NotificationsDrawer({
  notifications,
  onClose,
}: {
  notifications: ReturnType<typeof notificationsForActor>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-text-primary/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-bg-card border-l border-border-hairline z-50 overflow-y-auto">
        <div className="p-6 border-b border-border-hairline flex items-center justify-between">
          <div>
            <Kicker>Notificaciones</Kicker>
            <h3 className="text-h3 font-semibold text-text-primary mt-1">Vendedor</h3>
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
              <li key={n.id} className={cn('p-5', !n.read && 'bg-status-info-bg/30')}>
                <div className="text-body-sm font-semibold text-text-primary">{n.title}</div>
                <div className="text-body-sm text-text-secondary mt-1 leading-relaxed">{n.body}</div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
