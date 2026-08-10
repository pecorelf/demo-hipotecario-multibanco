import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Kicker, PageTitle } from '../../components/ui';
import { useDocsStore } from '../../store/docsStore';
import { DocumentItem, DocStatus } from '../../data/documentAgent';
import { RepairDrawer } from './RepairDrawer';
import {
  Check, AlertCircle, Clock, Upload, FileText,
  Sparkles, ArrowLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

export default function ClienteMisDocumentos() {
  const { documents, uploadDocument, resetDemo } = useDocsStore();
  const [openDoc, setOpenDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Solo docs del cliente (no del vendedor)
  const clientDocs = documents.filter((d) => d.owner === 'cliente');
  const approved = clientDocs.filter((d) => d.status === 'approved').length;
  const rejected = clientDocs.filter((d) => d.status === 'rejected').length;
  const inProgress = clientDocs.filter(
    (d) => d.status === 'analyzing' || d.status === 'uploading'
  ).length;
  const total = clientDocs.length;

  const handleUploadClick = (docId: string) => {
    setActiveDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocId) return;
    uploadDocument(activeDocId, file.name);
    e.target.value = ''; // reset
    setActiveDocId(null);
  };

  // Para demo: subir simulado sin selección de archivo real
  const handleDemoUpload = (docId: string, goodOrBad: 'good' | 'bad') => {
    const fileName = goodOrBad === 'good'
      ? `documento_completo.pdf`
      : `documento_mal.pdf`;
    uploadDocument(docId, fileName);
  };

  return (
    <div className="px-6 md:px-10 lg:px-16 py-12 lg:py-16 max-w-shell mx-auto">
      {/* Back link */}
      <Link
        to="/cliente/seguimiento"
        className="inline-flex items-center gap-2 text-body-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al seguimiento</span>
      </Link>

      {/* Header */}
      <header className="max-w-3xl">
        <Kicker>Etapa 3 · Recopilación de antecedentes</Kicker>
        <PageTitle className="mt-3">Mis documentos.</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Sube cada documento en el formato que tengas. El portal lee tus archivos,
          extrae los datos y te avisa si hay algo que corregir.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      {/* Top progress */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-body text-text-secondary">
            <span className="text-text-primary font-semibold">{approved}</span>
            <span> de {total} aprobados</span>
            {rejected > 0 && (
              <>
                <span className="text-text-muted"> · </span>
                <span className="text-status-error font-medium">{rejected} con reparo</span>
              </>
            )}
            {inProgress > 0 && (
              <>
                <span className="text-text-muted"> · </span>
                <span className="text-accent font-medium">{inProgress} en análisis</span>
              </>
            )}
          </div>
          <button
            onClick={resetDemo}
            className="text-caption uppercase tracking-[0.14em] text-text-muted hover:text-text-primary inline-flex items-center gap-1.5"
            title="Reiniciar demo"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reiniciar demo</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-bg-sunken rounded-sm overflow-hidden">
          <div
            className="h-full bg-status-success transition-all duration-500"
            style={{ width: `${(approved / total) * 100}%` }}
          />
        </div>
      </section>

      {/* Document list */}
      <section className="mt-10 space-y-3">
        {clientDocs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            onOpenRepair={() => setOpenDoc(doc)}
            onUpload={() => handleUploadClick(doc.id)}
            onDemoGood={() => handleDemoUpload(doc.id, 'good')}
            onDemoBad={() => handleDemoUpload(doc.id, 'bad')}
          />
        ))}
      </section>

      {/* Tip block */}
      <section className="mt-10 bg-bg-sunken/50 border border-border-hairline rounded-sm p-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-h3 text-text-primary font-semibold">
              Aceptamos cualquier formato.
            </h3>
            <p className="text-body text-text-secondary mt-2 leading-relaxed max-w-measure">
              No te preocupes por el formato. Puedes subir PDF, foto del
              teléfono, scan o captura. Procesamos el contenido, extraemos los datos
              que necesitamos y te avisamos si falta algo.
            </p>
          </div>
        </div>
      </section>

      {/* Hidden file input para upload real (opcional) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Repair drawer */}
      <RepairDrawer doc={openDoc} onClose={() => setOpenDoc(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DOCUMENT ROW
// ─────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  onOpenRepair,
  onUpload,
  onDemoGood,
  onDemoBad,
}: {
  doc: DocumentItem;
  onOpenRepair: () => void;
  onUpload: () => void;
  onDemoGood: () => void;
  onDemoBad: () => void;
}) {
  const isProcessing = doc.status === 'uploading' || doc.status === 'analyzing';

  return (
    <div
      className={[
        'border bg-bg-card rounded-sm transition-all',
        doc.status === 'rejected' && 'border-status-error/40',
        doc.status === 'approved' && 'border-border-hairline',
        doc.status === 'pending' && 'border-border-hairline',
        doc.status === 'review' && 'border-border-hairline',
        isProcessing && 'border-accent',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* MAIN ROW */}
      <div className="flex items-start gap-4 p-5">
        {/* Status indicator */}
        <StatusIcon status={doc.status} />

        {/* Doc info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-h3 text-text-primary font-semibold">
              {doc.name}
            </h3>
            {doc.critical && (
              <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
                requerido
              </span>
            )}
            <StatusPill status={doc.status} />
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {doc.description}
          </p>

          {/* Approved: extracted fields */}
          {doc.status === 'approved' && doc.extractedFields && (
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 max-w-2xl">
              {doc.extractedFields.map((f) => (
                <div key={f.label} className="text-body-sm">
                  <div className="text-text-muted text-caption uppercase tracking-[0.14em]">
                    {f.label}
                  </div>
                  <div className="text-text-primary font-medium">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Rejected: error preview */}
          {doc.status === 'rejected' && doc.repair && (
            <div className="mt-4 bg-status-error-bg/60 border border-status-error/20 rounded-sm p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-status-error flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-body-sm text-text-primary font-semibold">
                    {doc.repair.title}
                  </div>
                  <p className="text-body-sm text-text-secondary mt-1 line-clamp-2">
                    {doc.repair.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analyzing: agent animation */}
          {isProcessing && (
            <AgentAnalyzing fileName={doc.fileName} stage={doc.status} />
          )}

          {/* Bottom meta */}
          {doc.fileName && !isProcessing && (
            <p className="text-caption text-text-muted mt-3 font-mono">
              {doc.fileName} · {doc.uploadedAt}
            </p>
          )}
        </div>

        {/* Right side: actions */}
        <div className="flex-shrink-0 flex flex-col gap-2 min-w-[160px] items-stretch">
          {doc.status === 'pending' && (
            <>
              <button
                onClick={onDemoGood}
                className="bg-accent hover:bg-accent-muted text-text-inverse text-body-sm px-4 py-2 rounded-sm transition-colors font-medium inline-flex items-center justify-center gap-2"
                title="Demo: subir versión correcta"
              >
                <Upload className="w-4 h-4" />
                <span>Subir documento</span>
              </button>
              <button
                onClick={onDemoBad}
                className="bg-transparent border border-border-hairline hover:border-text-muted text-text-muted text-caption px-3 py-1.5 rounded-sm transition-colors"
                title="Demo: simular versión con problema"
              >
                Probar Archivo Demo
              </button>
            </>
          )}
          {doc.status === 'rejected' && (
            <button
              onClick={onOpenRepair}
              className="bg-accent hover:bg-accent-muted text-text-inverse text-body-sm px-4 py-2 rounded-sm transition-colors font-medium inline-flex items-center justify-center gap-2"
            >
              <span>Ver detalle</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {doc.status === 'review' && (
            <div className="text-caption text-text-muted text-center py-2">
              En revisión
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AGENT ANALYZING — animation
// ─────────────────────────────────────────────────────────

function AgentAnalyzing({
  fileName,
  stage,
}: {
  fileName?: string;
  stage: DocStatus;
}) {
  const steps = [
    { id: 'upload', label: 'Recibiendo archivo' },
    { id: 'read', label: 'Leyendo contenido' },
    { id: 'extract', label: 'Extrayendo datos' },
    { id: 'validate', label: 'Validando requisitos' },
  ];

  // Determinar qué pasos están completados según stage
  const activeStep = stage === 'uploading' ? 0 : 2; // analyzing ~ paso 2

  return (
    <div className="mt-4 bg-bg-sunken/40 border border-accent/30 rounded-sm p-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full animate-skeleton-pulse" />
        </div>
        <span className="text-body-sm text-accent font-medium">
          Procesando documento
        </span>
        <span className="text-caption text-text-muted ml-auto animate-ai-cursor">
          ▎
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          const isPending = idx > activeStep;

          return (
            <div
              key={step.id}
              className="flex items-center gap-2.5 text-body-sm"
            >
              {isDone && (
                <Check className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
              )}
              {isActive && (
                <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent rounded-full animate-skeleton-pulse" />
                </div>
              )}
              {isPending && (
                <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-border-hairline rounded-full" />
                </div>
              )}
              <span
                className={[
                  isDone && 'text-text-secondary',
                  isActive && 'text-text-primary font-medium',
                  isPending && 'text-text-muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {fileName && (
        <p className="text-caption text-text-muted mt-3 font-mono">
          {fileName}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STATUS ICON + PILL
// ─────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: DocStatus }) {
  const base = 'w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5';

  if (status === 'approved')
    return (
      <div className={`${base} bg-status-success-bg`}>
        <Check className="w-5 h-5 text-status-success" />
      </div>
    );
  if (status === 'rejected')
    return (
      <div className={`${base} bg-status-error-bg`}>
        <AlertCircle className="w-5 h-5 text-status-error" />
      </div>
    );
  if (status === 'review')
    return (
      <div className={`${base} bg-status-warning-bg`}>
        <Clock className="w-5 h-5 text-status-warning" />
      </div>
    );
  if (status === 'uploading' || status === 'analyzing')
    return (
      <div className={`${base} bg-bg-sunken`}>
        <Sparkles className="w-5 h-5 text-accent animate-skeleton-pulse" />
      </div>
    );
  return (
    <div className={`${base} bg-bg-sunken`}>
      <FileText className="w-5 h-5 text-text-muted" />
    </div>
  );
}

function StatusPill({ status }: { status: DocStatus }) {
  const base = 'text-caption uppercase tracking-[0.14em] font-medium px-2 py-0.5 rounded-sm';

  if (status === 'approved')
    return <span className={`${base} text-status-success bg-status-success-bg`}>Aprobado</span>;
  if (status === 'rejected')
    return <span className={`${base} text-status-error bg-status-error-bg`}>Con reparo</span>;
  if (status === 'review')
    return <span className={`${base} text-status-warning bg-status-warning-bg`}>En revisión</span>;
  if (status === 'uploading')
    return <span className={`${base} text-accent bg-status-error-bg/30`}>Subiendo</span>;
  if (status === 'analyzing')
    return <span className={`${base} text-accent bg-status-error-bg/30`}>Analizando</span>;
  return <span className={`${base} text-text-muted bg-bg-sunken`}>Pendiente</span>;
}
