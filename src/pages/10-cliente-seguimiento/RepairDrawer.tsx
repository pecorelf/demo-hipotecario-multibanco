import { useEffect } from 'react';
import { X, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { DocumentItem } from '../../data/documentAgent';
import { useDocsStore } from '../../store/docsStore';

type RepairDrawerProps = {
  doc: DocumentItem | null;
  onClose: () => void;
};

export function RepairDrawer({ doc, onClose }: RepairDrawerProps) {
  const { uploadDocument } = useDocsStore();

  // ESC para cerrar
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  if (!doc || !doc.repair) return null;

  const handleResubmit = () => {
    // Cierra el modal y dispara una nueva subida con nombre "corregido"
    const newFileName = `${doc.name.toLowerCase().replace(/\s+/g, '_')}_corregido.pdf`;
    onClose();
    uploadDocument(doc.id, newFileName);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-bg-overlay animate-fade-in z-40"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-[560px] bg-bg-card border-l border-border-hairline shadow-soft animate-slide-in-right z-50 overflow-y-auto"
        role="dialog"
        aria-labelledby="repair-title"
      >
        <div className="p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-caption uppercase tracking-[0.14em] font-medium text-status-error bg-status-error-bg px-3 py-1 rounded-sm">
                <AlertCircle className="w-3 h-3" />
                <span>Necesita atención</span>
              </div>
              <h2
                id="repair-title"
                className="text-h2 mt-3 text-text-primary"
              >
                {doc.name}
              </h2>
              {doc.fileName && (
                <p className="text-body-sm text-text-muted mt-1 font-mono">
                  {doc.fileName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <span aria-hidden className="block w-12 h-px bg-border-hairline mt-6" />

          {/* AI explanation block */}
          <div className="mt-8 bg-bg-sunken/60 border border-border-hairline rounded-sm p-6">
            <div className="flex items-center gap-2 text-caption uppercase tracking-[0.14em] font-medium text-text-muted">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Revisamos tu documento</span>
            </div>

            <h3 className="text-h3 mt-3 text-text-primary font-semibold">
              {doc.repair.title}
            </h3>

            <p className="text-body text-text-secondary mt-4 leading-relaxed">
              {doc.repair.explanation}
            </p>
          </div>

          {/* What to do — idioma corriente */}
          <div className="mt-6">
            <div className="text-caption uppercase tracking-[0.14em] font-medium text-text-muted">
              Qué tienes que hacer
            </div>
            <p className="text-body-lg text-text-primary mt-2 leading-relaxed">
              {doc.repair.instruction}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-10 space-y-3">
            <button
              onClick={handleResubmit}
              className="w-full bg-accent hover:bg-accent-muted text-text-inverse text-body py-3.5 rounded-sm transition-colors font-medium inline-flex items-center justify-center gap-2"
            >
              <span>Subir versión corregida</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-full bg-transparent border border-border-hairline hover:border-text-primary text-text-secondary py-3 rounded-sm transition-colors text-body"
            >
              Volver a mis documentos
            </button>
          </div>

          {/* Footer disclaimer */}
          <p className="text-caption text-text-muted mt-8 leading-relaxed">
            Revisamos el documento que subiste y lo comparamos con los
            requisitos. Si necesitas ayuda, tu ejecutiva Camila Reinoso te
            puede llamar.
          </p>
        </div>
      </aside>
    </>
  );
}
