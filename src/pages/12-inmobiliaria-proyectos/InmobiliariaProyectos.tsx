import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  Clock,
  FileText,
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
 * Portal de la Inmobiliaria.
 *
 * Aplica cuando propertyType = 'nueva'. La inmobiliaria sube los
 * documentos legales del proyecto (permiso de edificación, recepción
 * definitiva, etc).
 *
 * Si propertyType = 'usada', estos documentos los gestiona el vendedor
 * particular (ver /vendedor).
 */
export default function InmobiliariaProyectos() {
  const navigate = useNavigate();
  const {
    propertyType,
    propertyAddress,
    propertyValueUF,
    buyerName,
    inmobiliariaName,
    docs,
    notifications,
    uploadDoc,
    resolveRepair,
  } = usePostApprovalStore();

  const [notifOpen, setNotifOpen] = useState(false);

  const myDocs = docsByTrack(docs, 'titulos').filter(
    (d) => d.responsible === 'inmobiliaria',
  );
  const myRepairs = activeRepairsForActor(docs, 'inmobiliaria');
  const myNotifications = notificationsForActor(notifications, 'inmobiliaria');
  const myUnread = unreadCount(notifications, 'inmobiliaria');

  // Si es propiedad usada, mostrar mensaje aclarativo
  if (propertyType === 'usada') {
    return (
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16">
        <div className="max-w-2xl">
          <Kicker>Portal de Inmobiliaria</Kicker>
          <PageTitle className="mt-3">No aplicable a propiedades usadas</PageTitle>
          <p className="text-body-lg text-text-secondary mt-4 leading-relaxed">
            Esta operación es una propiedad usada, por lo que los documentos del
            inmueble los gestiona el vendedor particular. Cambia el tipo de
            propiedad a <strong>Nueva</strong> desde /admin para ver
            este flujo.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-text-inverse text-body font-medium hover:bg-accent transition-colors"
          >
            Ir a configuración de la demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-10 lg:py-12">
      <div className="flex items-start justify-between gap-6 max-w-4xl">
        <div>
          <Kicker>Inmobiliaria · Operación en curso</Kicker>
          <PageTitle className="mt-3">{inmobiliariaName}</PageTitle>
          <p className="text-body-lg text-text-secondary mt-3 leading-relaxed max-w-measure">
            {buyerName} está comprando una unidad en su proyecto con un crédito
            hipotecario en {BRAND.shortName}. Estos son los documentos legales del
            proyecto que el banco necesita para el estudio de títulos.
          </p>
        </div>

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

      <section className="mt-10 max-w-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
            <Building2 size={14} />
            <span>{propertyAddress}</span>
          </div>
          <div className="text-body-sm text-text-secondary">
            Valor: UF {propertyValueUF.toLocaleString('es-CL')}
          </div>
        </div>
      </section>

      {myRepairs.length > 0 && (
        <section className="mt-8 max-w-4xl">
          <div className="border-l-4 border-status-error bg-status-error-bg p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-body font-semibold text-status-error">
                  {myRepairs.length === 1 ? 'Tienen 1 reparo pendiente' : `Tienen ${myRepairs.length} reparos pendientes`}
                </div>
                <p className="text-body-sm text-text-primary mt-1">
                  El banco encontró observaciones en los documentos. Revísenlos
                  abajo y resuban corregidos para que la operación avance.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10 max-w-4xl">
        <h2 className="text-h2 font-semibold text-text-primary">
          Documentos del proyecto
        </h2>
        <p className="text-body text-text-secondary mt-2">
          Documentos legales que acreditan que el proyecto cumple con la
          normativa y está habilitado para entrega.
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

      {notifOpen && (
        <NotificationsDrawer
          notifications={myNotifications}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}

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
  if (status === 'validado') return <div className="w-7 h-7 flex items-center justify-center bg-status-success text-text-inverse"><Check size={14} /></div>;
  if (status === 'con_reparo') return <div className="w-7 h-7 flex items-center justify-center bg-status-error text-text-inverse"><X size={14} /></div>;
  if (status === 'en_validacion') return <div className="w-7 h-7 flex items-center justify-center bg-status-info text-text-inverse"><Clock size={14} /></div>;
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
            <h3 className="text-h3 font-semibold text-text-primary mt-1">Inmobiliaria</h3>
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
