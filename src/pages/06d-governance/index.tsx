import { useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSearch,
  Gauge,
  Loader2,
  Lock,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { claudeCompletion, extractStructured, extractTagged } from '@/lib/claude';
import {
  REGULATORY_AUDITOR_SYSTEM,
  buildRegulatoryExplanationPrompt,
  type RegulatoryExplanation,
} from '@/lib/prompts/regulatoryAuditor';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Models in production
// ─────────────────────────────────────────────────────────────

interface ModelEntry {
  id: string;
  name: string;
  version: string;
  type: string;
  ownerHuman: string;
  ownerRole: string;
  casesToday: number;
  accuracy: string;
  lastAudit: string;
  overrideRate: number; // pct
  inputs: string[];
  outputs: string[];
  rulesApplied: string[];
  sensitiveDataNotes: string;
  retrainingCadence: string;
  nextRetraining: string;
}

const MODELS: ModelEntry[] = [
  {
    id: 'm-inconsistencia-ingreso',
    name: 'Detección de inconsistencia de ingreso',
    version: 'v2.4.1',
    type: 'Clasificador binario',
    ownerHuman: 'Priscilla Von Dessauer',
    ownerRole: 'Gerente de Transformación',
    casesToday: 89,
    accuracy: '96,2%',
    lastAudit: 'hace 4 días',
    overrideRate: 6.2,
    inputs: [
      'Renta líquida declarada por cliente',
      'Promedio de cotizaciones Previred 12 meses',
      'Empleador declarado y empleador en F22',
      'Variabilidad mensual del ingreso',
    ],
    outputs: [
      'Veredicto: consistente / warning / error',
      'Severidad cuantificada (0-100)',
      'Sugerencia de acción al ejecutivo',
    ],
    rulesApplied: [
      'Política HC-007: tolerancia máxima 5% entre renta declarada y Previred',
      'Política HC-009: variabilidad intra-mes > 15% activa revisión humana',
      'CMF Circular 2.052: validación documental para créditos sobre UF 5.000',
    ],
    sensitiveDataNotes:
      'RUT y datos de empleador encriptados en reposo (AES-256). Anonimización en logs después de 24h. Cumple Ley 19.628.',
    retrainingCadence: 'Trimestral con muestra estratificada de 5.000 casos',
    nextRetraining: '15 jul 2026',
  },
  {
    id: 'm-scoring-credito',
    name: 'Scoring de riesgo crediticio',
    version: 'v3.1.0',
    type: 'Modelo ensemble (gradient boosting + reglas)',
    ownerHuman: 'José López Molina',
    ownerRole: 'Tecnología',
    casesToday: 412,
    accuracy: '94,7%',
    lastAudit: 'hace 1 día',
    overrideRate: 4.8,
    inputs: [
      'Variables del cliente (renta, antigüedad laboral, edad)',
      'Deuda consolidada CMF',
      'Historial bancario interno',
      'Score externo Equifax',
    ],
    outputs: [
      'Probabilidad de default a 12, 24 y 60 meses',
      'Categoría de riesgo (A, B, C, D)',
      'Tasa sugerida según categoría',
    ],
    rulesApplied: [
      'Política HC-022: cliente categoría D requiere comité',
      'CMF NCG 458: tratamiento de exposición crediticia',
      'Política interna de límites por segmento',
    ],
    sensitiveDataNotes:
      'Modelo no consume datos sensibles directos (género, religión, etnia). Auditoría de proxies trimestral.',
    retrainingCadence: 'Semestral con validación contra muestra OOT',
    nextRetraining: '12 ago 2026',
  },
  {
    id: 'm-ocr-ner',
    name: 'Extracción de documentos (OCR + NER)',
    version: 'v1.8.3',
    type: 'Pipeline OCR + Named Entity Recognition',
    ownerHuman: 'Eugenio Millar Moreira',
    ownerRole: 'Reingeniería de Procesos',
    casesToday: 1140,
    accuracy: '98,1%',
    lastAudit: 'hace 7 días',
    overrideRate: 1.4,
    inputs: [
      'Documentos PDF/JPG cargados por cliente o ejecutivo',
      'Tipo de documento esperado (cédula, liquidación, F22, etc.)',
    ],
    outputs: [
      'Campos estructurados extraídos del documento',
      'Score de confianza por campo',
      'Flag de revisión humana si score < 0,85',
    ],
    rulesApplied: [
      'Política HC-014: revisión humana obligatoria si confianza < 85%',
      'Política HC-015: validación cruzada de RUT contra base interna',
    ],
    sensitiveDataNotes:
      'Documentos almacenados en bucket cifrado con expiración a 365 días post-cierre del caso. PII redactada en logs.',
    retrainingCadence: 'Continuo (active learning sobre overrides humanos)',
    nextRetraining: 'En curso (actualización menor cada 2 semanas)',
  },
  {
    id: 'm-pre-aprobacion',
    name: 'Pre-aprobación instantánea',
    version: 'v2.0.5',
    type: 'Modelo de decisión + reglas duras',
    ownerHuman: 'Priscilla Von Dessauer',
    ownerRole: 'Gerente de Transformación',
    casesToday: 67,
    accuracy: '91,8%',
    lastAudit: 'hace 2 días',
    overrideRate: 12.3,
    inputs: [
      'Output del modelo de scoring',
      'Producto solicitado (tipo, plazo, monto)',
      'LTV calculado sobre tasación tentativa',
    ],
    outputs: [
      'Decisión: pre-aprobado / pre-aprobado con condición / requiere revisión',
      'Tasa indicativa',
      'Condiciones específicas',
    ],
    rulesApplied: [
      'Política HC-031: LTV máximo 90% primera vivienda',
      'Política HC-032: DTI máximo 25% del líquido',
      'CMF NCG 458 art. 12: límites por tipo de cliente',
    ],
    sensitiveDataNotes:
      'Decisión sin consumir variables prohibidas. Auditoría de equidad por género/edad/comuna mensual.',
    retrainingCadence: 'Trimestral',
    nextRetraining: '30 jun 2026',
  },
  {
    id: 'm-asistente',
    name: `Asistente conversacional ${BRAND.assistantName}`,
    version: 'v4.2.0',
    type: 'LLM con guardrails (Claude Sonnet base)',
    ownerHuman: 'José López Molina',
    ownerRole: 'Tecnología',
    casesToday: 234,
    accuracy: 'NPS 4,7/5',
    lastAudit: 'Monitoreo continuo',
    overrideRate: 0,
    inputs: [
      'Mensajes del cliente en lenguaje natural',
      'Contexto del caso (no incluye datos sensibles agregados)',
    ],
    outputs: [
      'Respuesta en lenguaje natural',
      'Estructuración del caso (régimen patrimonial, propiedad, pie, plazo)',
    ],
    rulesApplied: [
      'Política HC-051: no entrega de información sensible de terceros',
      'Política HC-052: no compromiso de aprobación o tasa específica',
      'Filtrado de prompt injection con clasificador adicional',
    ],
    sensitiveDataNotes:
      'Conversaciones almacenadas con cifrado y acceso restringido. No se usan para reentrenamiento del modelo base.',
    retrainingCadence: 'Sin reentrenamiento (modelo base fijo). Ajustes vía prompt y guardrails.',
    nextRetraining: 'N/A',
  },
  {
    id: 'm-fraude-promesa',
    name: 'Detección de fraude en promesa',
    version: 'v1.3.7',
    type: 'Clasificador con reglas + ML',
    ownerHuman: 'Eugenio Millar Moreira',
    ownerRole: 'Reingeniería de Procesos',
    casesToday: 8,
    accuracy: '99,4%',
    lastAudit: 'hace 12 horas',
    overrideRate: 8.7,
    inputs: [
      'Promesa de compraventa (campos extraídos)',
      'Datos del vendedor (CBR)',
      'Patrones históricos de fraude',
    ],
    outputs: [
      'Score de riesgo de fraude (0-100)',
      'Flags específicos disparados',
    ],
    rulesApplied: [
      'Política HC-067: validación obligatoria de vendedor en CBR',
      'Política HC-068: cruz con base interna de casos sospechosos',
    ],
    sensitiveDataNotes:
      'Datos de terceros (vendedores) procesados solo en el contexto del caso. No se reutilizan.',
    retrainingCadence: 'Trimestral con incorporación de nuevos patrones detectados',
    nextRetraining: '20 jul 2026',
  },
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function GovernanceDashboard() {
  const [selectedModel, setSelectedModel] = useState<ModelEntry | null>(null);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
      <header className="max-w-3xl">
        <Kicker>Tecnología y Riesgo · Observabilidad de IA</Kicker>
        <PageTitle className="mt-3">Observabilidad e IA Responsable</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Explicabilidad, control humano, métricas de precisión, tratamiento de
          sesgos, monitoreo, reentrenamiento y resguardo de datos sensibles.
          Cumplimiento con Ley 19.628 y normativa CMF.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      <div className="mt-12 space-y-16">
        <HeaderStats />
        <hr className="border-t border-border-hairline" />
        <ModelsInProductionSection
          models={MODELS}
          onSelect={setSelectedModel}
        />
        <hr className="border-t border-border-hairline" />
        <ExplainabilityOnDemand />
      </div>

      {selectedModel && (
        <ModelDrawer
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header stats
// ─────────────────────────────────────────────────────────────

function HeaderStats() {
  const stats = [
    {
      icon: <Brain size={16} />,
      label: 'Modelos en producción',
      value: '6',
      hint: 'Activos · monitoreo continuo',
    },
    {
      icon: <Gauge size={16} />,
      label: 'Decisiones automatizadas hoy',
      value: '1.247',
      hint: 'A las 14:32 · hora Chile',
    },
    {
      icon: <Users size={16} />,
      label: 'Tasa de override humano',
      value: '8,4%',
      hint: 'Control humano efectivo',
    },
    {
      icon: <ShieldCheck size={16} />,
      label: 'Sesgo crítico detectado',
      value: '0',
      hint: 'Último audit · hoy 08:00',
    },
  ];

  return (
    <section>
      <SectionTitle rule={false}>Snapshot de hoy</SectionTitle>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} padding="lg">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex items-center justify-center w-10 h-10 bg-bg-sunken text-text-secondary shrink-0"
              >
                {s.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
                  {s.label}
                </div>
                <div className="text-h2 text-text-primary tabular-nums mt-2">
                  {s.value}
                </div>
                <div className="text-caption text-text-muted mt-1">{s.hint}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Models in production
// ─────────────────────────────────────────────────────────────

function ModelsInProductionSection({
  models,
  onSelect,
}: {
  models: ModelEntry[];
  onSelect: (m: ModelEntry) => void;
}) {
  return (
    <section>
      <SectionTitle rule={false}>Modelos en producción</SectionTitle>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Seis modelos activos en el proceso hipotecario. Click en cualquiera
        para ver inputs, outputs, reglas aplicadas, tratamiento de datos
        sensibles y política de reentrenamiento.
      </p>

      <Card className="mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-bg-sunken">
              <tr className="text-caption uppercase tracking-[0.14em] text-text-muted">
                <th className="text-left px-5 py-4 font-normal">Modelo</th>
                <th className="text-left px-5 py-4 font-normal">Versión</th>
                <th className="text-right px-5 py-4 font-normal">Casos hoy</th>
                <th className="text-right px-5 py-4 font-normal">Precisión</th>
                <th className="text-right px-5 py-4 font-normal">Override</th>
                <th className="text-left px-5 py-4 font-normal">Último audit</th>
                <th className="text-left px-5 py-4 font-normal">Dueño humano</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => onSelect(m)}
                  className="border-t border-border-hairline cursor-pointer hover:bg-bg-sunken transition-colors duration-base"
                >
                  <td className="px-5 py-4 text-text-primary">{m.name}</td>
                  <td className="px-5 py-4 text-text-muted tabular-nums">
                    {m.version}
                  </td>
                  <td className="px-5 py-4 text-right text-text-secondary tabular-nums">
                    {m.casesToday.toLocaleString('es-CL')}
                  </td>
                  <td className="px-5 py-4 text-right text-text-primary tabular-nums">
                    {m.accuracy}
                  </td>
                  <td className="px-5 py-4 text-right text-text-secondary tabular-nums">
                    {m.overrideRate.toFixed(1)}%
                  </td>
                  <td className="px-5 py-4 text-text-muted">{m.lastAudit}</td>
                  <td className="px-5 py-4">
                    <div className="text-text-primary">{m.ownerHuman}</div>
                    <div className="text-caption text-text-muted">
                      {m.ownerRole}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-muted">
                    <ChevronRight size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Model drawer (drill-down)
// ─────────────────────────────────────────────────────────────

function ModelDrawer({
  model,
  onClose,
}: {
  model: ModelEntry;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-bg-overlay z-30 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed right-0 top-0 bottom-0 w-full md:w-[560px] bg-bg-page border-l border-border-hairline z-40 overflow-y-auto animate-slide-in-right"
        role="dialog"
        aria-labelledby="model-drawer-title"
      >
        <header className="sticky top-0 bg-bg-page border-b border-border-hairline z-10">
          <div className="px-8 md:px-10 py-6 flex items-center justify-between gap-4">
            <Kicker tone="muted">Detalle de modelo</Kicker>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors duration-base"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="px-8 md:px-10 py-8 border-b border-border-hairline">
          <h2 id="model-drawer-title" className="text-h2 text-text-primary leading-tight">
            {model.name}
          </h2>
          <div className="mt-3 flex items-center gap-3 flex-wrap text-caption text-text-muted">
            <span className="tabular-nums">{model.version}</span>
            <span aria-hidden>·</span>
            <span>{model.type}</span>
          </div>
        </div>

        <DrawerSection
          icon={<Eye size={14} />}
          title="Explicabilidad · inputs"
          subtitle="Variables que recibe el modelo"
        >
          <ul className="space-y-2">
            {model.inputs.map((inp, i) => (
              <li key={i} className="flex gap-2 text-body-sm text-text-secondary">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0 mt-2"
                />
                {inp}
              </li>
            ))}
          </ul>
        </DrawerSection>

        <DrawerSection
          icon={<Sparkles size={14} />}
          title="Explicabilidad · outputs"
          subtitle="Resultados que produce"
        >
          <ul className="space-y-2">
            {model.outputs.map((out, i) => (
              <li key={i} className="flex gap-2 text-body-sm text-text-secondary">
                <span
                  aria-hidden
                  className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0 mt-2"
                />
                {out}
              </li>
            ))}
          </ul>
        </DrawerSection>

        <DrawerSection
          icon={<Scale size={14} />}
          title="Reglas aplicadas"
          subtitle="Políticas internas y normativa"
        >
          <ul className="space-y-3">
            {model.rulesApplied.map((rule, i) => (
              <li
                key={i}
                className="text-body-sm text-text-secondary leading-relaxed"
              >
                {rule}
              </li>
            ))}
          </ul>
        </DrawerSection>

        <DrawerSection
          icon={<Users size={14} />}
          title="Control humano"
          subtitle="Human-in-the-loop"
        >
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body-sm text-text-secondary">
                Tasa de override humano
              </span>
              <span className="text-body-sm text-text-primary tabular-nums">
                {model.overrideRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-caption text-text-muted leading-relaxed">
              {model.overrideRate < 5
                ? 'Tasa baja indica alta confianza en las decisiones automáticas.'
                : model.overrideRate < 10
                  ? 'Tasa moderada. Revisión humana sólida sobre casos de baja confianza.'
                  : 'Tasa alta. Revisar si el modelo necesita ajuste o si el umbral de auto-aprobación es muy permisivo.'}
            </p>
          </div>
        </DrawerSection>

        <DrawerSection
          icon={<Lock size={14} />}
          title="Resguardo de datos sensibles"
          subtitle="PII y cumplimiento Ley 19.628"
        >
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {model.sensitiveDataNotes}
          </p>
        </DrawerSection>

        <DrawerSection
          icon={<Brain size={14} />}
          title="Reentrenamiento"
          subtitle="Lifecycle del modelo"
        >
          <dl className="space-y-3">
            <div>
              <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Cadencia
              </dt>
              <dd className="text-body-sm text-text-primary mt-1">
                {model.retrainingCadence}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Próxima fecha
              </dt>
              <dd className="text-body-sm text-text-primary mt-1">
                {model.nextRetraining}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
                Último audit
              </dt>
              <dd className="text-body-sm text-text-primary mt-1">
                {model.lastAudit}
              </dd>
            </div>
          </dl>
        </DrawerSection>

        <div className="px-8 md:px-10 py-8 space-y-3">
          <p className="text-caption text-text-muted">
            Dueño humano:{' '}
            <span className="text-text-primary">{model.ownerHuman}</span> ·{' '}
            {model.ownerRole}
          </p>
        </div>
      </aside>
    </>
  );
}

function DrawerSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-8 md:px-10 py-8 border-b border-border-hairline">
      <header className="flex items-start gap-3 mb-5">
        <span
          aria-hidden
          className="flex items-center justify-center w-9 h-9 bg-bg-sunken text-text-secondary shrink-0"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <Kicker tone="muted">{subtitle}</Kicker>
          <h3 className="text-h3 text-text-primary mt-1">{title}</h3>
        </div>
      </header>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Explainability on demand
// ─────────────────────────────────────────────────────────────

function ExplainabilityOnDemand() {
  const [input, setInput] = useState('HIP-2026-0042');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [explanation, setExplanation] = useState<RegulatoryExplanation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const requestedRef = useRef<string | null>(null);

  async function handleExplain() {
    const trimmed = input.trim();
    if (!trimmed) return;
    requestedRef.current = trimmed;
    setPhase('loading');
    setExplanation(null);
    setErrorMsg(null);
    try {
      const response = await claudeCompletion(
        [{ role: 'user', content: buildRegulatoryExplanationPrompt(trimmed) }],
        REGULATORY_AUDITOR_SYSTEM,
        { maxTokens: 1200, temperature: 0.3 },
      );
      const tagged = extractTagged(response, 'regulatory_explanation');
      const source = tagged ?? response;
      const parsed = extractStructured<RegulatoryExplanation>(source);
      setExplanation(parsed);
      setPhase('done');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error inesperado');
      setPhase('error');
    }
  }

  return (
    <section>
      <SectionTitle rule={false}>Explicabilidad en demanda</SectionTitle>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Genera una explicación regulatoria de cualquier decisión automatizada
        del proceso. Apta para usuarios finales y para reguladores. Incluye
        modelo usado, inputs, reglas aplicadas, resultado, control humano,
        tratamiento de datos sensibles y verificación de sesgo.
      </p>

      <Card padding="lg" className="mt-8">
        <Kicker tone="muted" className="block mb-4">
          Auditor regulador IA
        </Kicker>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExplain();
              }}
              placeholder="ID del caso (ej. HIP-2026-0042)"
              className={cn(
                'w-full bg-bg-card border border-border-hairline',
                'pl-9 pr-3 py-2.5 text-body-sm text-text-primary',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleExplain}
            disabled={phase === 'loading' || !input.trim()}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {phase === 'loading' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <FileSearch size={14} />
                Explicar decisión
              </>
            )}
          </button>
        </div>
        <p className="text-caption text-text-muted mt-3">
          La explicación se genera con IA en formato estructurado. Trazabilidad
          completa de inputs, modelos, reglas y resultados.
        </p>
      </Card>

      {phase === 'loading' && (
        <Card padding="lg" className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-body-sm text-text-secondary">
            <Loader2 size={14} className="animate-spin" />
            El Auditor Regulador está reconstruyendo la decisión…
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      )}

      {phase === 'error' && errorMsg && (
        <Card padding="lg" className="mt-6">
          <div className="flex items-start gap-2 text-body-sm text-status-error">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        </Card>
      )}

      {phase === 'done' && explanation && (
        <ExplanationReport explanation={explanation} />
      )}
    </section>
  );
}

function ExplanationReport({ explanation }: { explanation: RegulatoryExplanation }) {
  return (
    <Card padding="lg" className="mt-6 animate-fade-in space-y-8">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Kicker tone="accent">Informe regulatorio · caso {explanation.caseId}</Kicker>
          <h3 className="text-h3 text-text-primary mt-2">
            Decisión automatizada
          </h3>
        </div>
        <Pill variant="neutral" size="sm">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={10} aria-hidden />
            Apto para CMF
          </span>
        </Pill>
      </header>

      <section>
        <p className="text-body text-text-primary leading-relaxed">
          {explanation.decisionSummary}
        </p>
      </section>

      <ReportSection icon={<Brain size={14} />} title="Modelo utilizado">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-body-sm">
          <Field label="Nombre" value={explanation.modelUsed.name} />
          <Field label="Versión" value={explanation.modelUsed.version} />
          <Field label="Tipo" value={explanation.modelUsed.type} />
          <Field label="Último reentrenamiento" value={explanation.modelUsed.lastTraining} />
        </dl>
      </ReportSection>

      <ReportSection icon={<Eye size={14} />} title="Inputs procesados">
        <ul className="space-y-2">
          {explanation.inputs.map((inp, i) => (
            <li key={i} className="flex gap-2 text-body-sm text-text-secondary">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0 mt-2"
              />
              {inp}
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection icon={<Scale size={14} />} title="Reglas aplicadas">
        <ul className="space-y-3">
          {explanation.rulesApplied.map((rule, i) => (
            <li key={i} className="text-body-sm text-text-secondary leading-relaxed">
              {rule}
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection icon={<Sparkles size={14} />} title="Resultado generado">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          {explanation.output}
        </p>
      </ReportSection>

      <ReportSection icon={<Users size={14} />} title="Control humano (HITL)">
        <div className="space-y-3 text-body-sm">
          <div className="flex items-baseline gap-2">
            {explanation.humanInTheLoop.wasReviewedByHuman ? (
              <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={14} className="text-status-warning shrink-0 mt-0.5" />
            )}
            <span className="text-text-primary">
              {explanation.humanInTheLoop.wasReviewedByHuman
                ? 'Sí, esta decisión fue revisada por un humano.'
                : 'No, esta decisión se ejecutó automáticamente.'}
            </span>
          </div>
          <Field
            label="Revisor"
            value={explanation.humanInTheLoop.reviewedBy}
          />
          <Field
            label="Decisión final"
            value={explanation.humanInTheLoop.reviewDecision}
          />
        </div>
      </ReportSection>

      <ReportSection
        icon={<Lock size={14} />}
        title="Resguardo de datos sensibles"
      >
        <p className="text-body-sm text-text-secondary leading-relaxed">
          {explanation.sensitiveDataHandling}
        </p>
      </ReportSection>

      <ReportSection icon={<ShieldCheck size={14} />} title="Verificación de sesgo">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          {explanation.biasCheck}
        </p>
      </ReportSection>
    </Card>
  );
}

function ReportSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden className="text-accent">
          {icon}
        </span>
        <Kicker tone="muted">{title}</Kicker>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd className="text-text-primary mt-1">{value}</dd>
    </div>
  );
}
