import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertCircle, Sparkles, X } from 'lucide-react';
import { useDocsStore, Notification } from '../../store/docsStore';

export function NotificationBell() {
  const { notifications, markNotifRead, markAllNotifsRead } = useDocsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Listen for external open requests (from dashboard cards, etc.)
  useEffect(() => {
    const onExternalOpen = () => setOpen(true);
    window.addEventListener('open-notif-panel', onExternalOpen);
    return () => window.removeEventListener('open-notif-panel', onExternalOpen);
  }, []);

  const handleNotifClick = (n: Notification) => {
    markNotifRead(n.id);
    if (n.docId) {
      setOpen(false);
      navigate('/cliente/mis-documentos');
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-sm hover:bg-bg-sunken transition-colors flex items-center justify-center"
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-accent rounded-full flex items-center justify-center text-caption font-medium text-text-inverse px-1">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[400px] max-w-[calc(100vw-2rem)] bg-bg-card border border-border-hairline shadow-soft rounded-sm overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border-hairline flex items-center justify-between">
            <div>
              <h3 className="text-body font-semibold text-text-primary">
                Notificaciones
              </h3>
              {unread > 0 && (
                <div className="text-caption text-text-muted mt-0.5">
                  {unread} sin leer
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllNotifsRead}
                  className="text-caption uppercase tracking-[0.14em] text-text-muted hover:text-text-primary transition-colors"
                >
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text-primary"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[480px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Bell className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <p className="text-body-sm text-text-muted">
                  No tienes notificaciones nuevas.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={[
                    'w-full text-left px-5 py-4 border-b border-border-hairline last:border-b-0 transition-colors hover:bg-bg-sunken/40 block',
                    !n.read && 'bg-bg-sunken/30',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <NotifIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-body-sm font-semibold text-text-primary truncate">
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-body-sm text-text-secondary mt-0.5 leading-snug line-clamp-2">
                        {n.body}
                      </p>
                      <div className="text-caption text-text-muted mt-1.5">
                        {n.timestamp}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border-hairline bg-bg-sunken/20">
            <p className="text-caption text-text-muted text-center">
              Las notificaciones llegan también a tu app y home banking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifIcon({ type }: { type: 'success' | 'warning' | 'info' }) {
  const base = 'w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0';
  if (type === 'success')
    return <div className={`${base} bg-status-success-bg`}><Check className="w-4 h-4 text-status-success" /></div>;
  if (type === 'warning')
    return <div className={`${base} bg-status-error-bg`}><AlertCircle className="w-4 h-4 text-status-error" /></div>;
  return <div className={`${base} bg-bg-sunken`}><Sparkles className="w-4 h-4 text-accent" /></div>;
}
