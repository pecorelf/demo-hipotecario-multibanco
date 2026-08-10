import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Loader2,
  Mic,
  Newspaper,
  Pause,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  Kicker,
  Pill,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import {
  COMPETITIVE_ACTIONS_SYSTEM,
  MARKET_INTEL,
  PODCAST_SCRIPT_SYSTEM,
  RADAR_DIMENSIONS,
  buildCompetitiveActionsPrompt,
  buildPodcastScriptPrompt,
  type CompetitiveActionsResult,
  type MarketIntelItem,
  type RadarDimension,
} from '@/lib/prompts/competitiveRadar';
import { claudeCompletion, extractStructured, extractTagged } from '@/lib/claude';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────

export function CompetitiveRadarSection() {
  return (
    <section>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <SectionTitle rule={false}>Radar competitivo</SectionTitle>
        <span className="text-caption uppercase tracking-[0.14em] text-text-muted">
          Actualizado · 20 may 2026
        </span>
      </div>
      <p className="text-body text-text-secondary mt-3 max-w-measure">
        Posicionamiento de {BRAND.shortName} vs principales competidores. Inteligencia
        del mercado y acciones sugeridas por Aurora.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <RadarChart />
        <PodcastCard />
      </div>

      <div className="mt-12">
        <MarketIntelGrid />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Radar chart (SVG)
// ─────────────────────────────────────────────────────────────

const COMPETITORS = [
  { key: 'banco', label: BRAND.shortName, color: 'var(--color-accent-primary)', strokeWidth: 2.5 },
  { key: 'competidorC', label: 'Banco Competidor C', color: '#4A463F', strokeWidth: 1.5 },
  { key: 'competidorA', label: 'Competidor A', color: '#928B7E', strokeWidth: 1.5 },
  { key: 'competidorB', label: 'BCI', color: '#A56A00', strokeWidth: 1.5 },
] as const;

function RadarChart() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [visibleBanks, setVisibleBanks] = useState<Set<string>>(
    new Set(COMPETITORS.map((c) => c.key)),
  );

  function toggleBank(key: string) {
    setVisibleBanks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <Kicker tone="muted">Mapa de posicionamiento</Kicker>
          <h3 className="text-h3 text-text-primary mt-1">
            {BRAND.shortName} vs principales competidores
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-8 items-center">
        <div className="flex justify-center">
          <RadarSvg
            dimensions={RADAR_DIMENSIONS}
            visibleBanks={visibleBanks}
            hoveredDim={hovered}
            onHoverDim={setHovered}
          />
        </div>

        <div className="space-y-3">
          <Kicker tone="muted" className="block">
            Competidores
          </Kicker>
          {COMPETITORS.map((c) => {
            const isVisible = visibleBanks.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleBank(c.key)}
                className={cn(
                  'w-full flex items-center gap-3 text-body-sm transition-opacity duration-base',
                  isVisible ? 'opacity-100' : 'opacity-35',
                )}
              >
                <span
                  aria-hidden
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-text-primary">{c.label}</span>
              </button>
            );
          })}
          <p className="text-caption text-text-muted pt-3 border-t border-border-hairline mt-4">
            Click en un competidor para ocultarlo. Hover sobre un eje para ver
            las cifras crudas.
          </p>
        </div>
      </div>

      {hovered && <DimensionTooltip dim={RADAR_DIMENSIONS.find((d) => d.key === hovered)!} />}
    </Card>
  );
}

function RadarSvg({
  dimensions,
  visibleBanks,
  hoveredDim,
  onHoverDim,
}: {
  dimensions: RadarDimension[];
  visibleBanks: Set<string>;
  hoveredDim: string | null;
  onHoverDim: (key: string | null) => void;
}) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 60;
  const levels = 5;

  // Compute axis end points
  const axes = dimensions.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
    return {
      ...dim,
      angle,
      x: cx + Math.cos(angle) * maxR,
      y: cy + Math.sin(angle) * maxR,
      // Label position (a bit further out)
      lx: cx + Math.cos(angle) * (maxR + 32),
      ly: cy + Math.sin(angle) * (maxR + 32),
    };
  });

  function pointsFor(bankKey: keyof RadarDimension) {
    return dimensions
      .map((dim, i) => {
        const value = dim[bankKey] as number;
        const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
        const r = (value / 100) * maxR;
        return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
      })
      .join(' ');
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Radar competitivo"
    >
      {/* Grid concentric polygons */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (maxR * (i + 1)) / levels;
        const points = dimensions
          .map((_, di) => {
            const angle = (Math.PI * 2 * di) / dimensions.length - Math.PI / 2;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          })
          .join(' ');
        return (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--color-border-hairline)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Axes */}
      {axes.map((axis) => (
        <line
          key={axis.key}
          x1={cx}
          y1={cy}
          x2={axis.x}
          y2={axis.y}
          stroke="var(--color-border-hairline)"
          strokeWidth={0.5}
        />
      ))}

      {/* Series — drawn from bottom to top: weakest first, {BRAND.shortName} last for emphasis */}
      {COMPETITORS.slice()
        .reverse()
        .filter((c) => visibleBanks.has(c.key))
        .map((c) => (
          <polygon
            key={c.key}
            points={pointsFor(c.key as keyof RadarDimension)}
            fill={c.color}
            fillOpacity={c.key === 'banco' ? 0.18 : 0.08}
            stroke={c.color}
            strokeWidth={c.strokeWidth}
            strokeLinejoin="round"
          />
        ))}

      {/* Hover hit areas + labels */}
      {axes.map((axis, i) => {
        const isHovered = hoveredDim === axis.key;
        const textAnchor =
          axis.lx < cx - 5 ? 'end' : axis.lx > cx + 5 ? 'start' : 'middle';
        // Split long labels
        const words = axis.label.split(' ');
        const lines: string[] = [];
        let cur = '';
        for (const w of words) {
          if ((cur + ' ' + w).trim().length > 14 && cur) {
            lines.push(cur);
            cur = w;
          } else {
            cur = (cur + ' ' + w).trim();
          }
        }
        if (cur) lines.push(cur);

        return (
          <g
            key={axis.key}
            onMouseEnter={() => onHoverDim(axis.key)}
            onMouseLeave={() => onHoverDim(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible hit area */}
            <circle cx={axis.x} cy={axis.y} r={28} fill="transparent" />
            <text
              x={axis.lx}
              y={axis.ly}
              fontSize={11}
              fill={isHovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'}
              fontWeight={isHovered ? 500 : 400}
              textAnchor={textAnchor}
              dominantBaseline="middle"
            >
              {lines.map((ln, idx) => (
                <tspan
                  key={idx}
                  x={axis.lx}
                  dy={idx === 0 ? -((lines.length - 1) * 6) : 12}
                >
                  {ln}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DimensionTooltip({ dim }: { dim: RadarDimension }) {
  return (
    <div className="mt-6 pt-6 border-t border-border-hairline">
      <Kicker tone="muted" className="block mb-3">
        {dim.label}
      </Kicker>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-body-sm">
        {COMPETITORS.map((c) => {
          const rawKey = `${c.key}Raw` as keyof RadarDimension;
          const value = dim[rawKey] as string;
          return (
            <div key={c.key}>
              <dt className="flex items-center gap-2 text-text-muted">
                <span
                  aria-hidden
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                {c.label}
              </dt>
              <dd className="text-text-primary mt-1 tabular-nums">{value}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Podcast Card
// ─────────────────────────────────────────────────────────────

function PodcastCard() {
  const [phase, setPhase] = useState<'idle' | 'generating' | 'ready' | 'playing' | 'paused'>(
    'idle',
  );
  const [script, setScript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function generateAndPlay() {
    setError(null);
    if (!script) {
      setPhase('generating');
      try {
        const response = await claudeCompletion(
          [{ role: 'user', content: buildPodcastScriptPrompt(MARKET_INTEL) }],
          PODCAST_SCRIPT_SYSTEM,
          { maxTokens: 600, temperature: 0.6 },
        );
        setScript(response.trim());
        setPhase('ready');
        // Start playback right after
        setTimeout(() => playScript(response.trim()), 200);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado');
        setPhase('idle');
      }
    } else {
      playScript(script);
    }
  }

  function playScript(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('Tu navegador no soporta síntesis de voz.');
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'es-CL';
    utt.rate = 1.0;
    utt.pitch = 1.0;
    // Pick a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice =
      voices.find((v) => v.lang.startsWith('es')) ?? voices[0];
    if (spanishVoice) utt.voice = spanishVoice;
    utt.onend = () => setPhase('ready');
    utt.onerror = () => {
      setError('No se pudo reproducir el audio.');
      setPhase('ready');
    };
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setPhase('playing');
  }

  function pause() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.pause();
    setPhase('paused');
  }

  function resume() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.resume();
    setPhase('playing');
  }

  function stop() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setPhase('ready');
  }

  return (
    <Card padding="lg" className="space-y-5 h-full">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex items-center justify-center w-10 h-10 bg-accent/10 text-accent shrink-0"
        >
          <Mic size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <Kicker tone="muted">Podcast semanal</Kicker>
          <h3 className="text-h3 text-text-primary mt-1">
            Inteligencia competitiva en 90 segundos
          </h3>
        </div>
      </div>

      <p className="text-body-sm text-text-secondary leading-relaxed">
        Resumen ejecutivo generado por IA con los movimientos clave del mercado
        hipotecario chileno esta semana. Voz sintetizada por tu navegador.
      </p>

      <div className="pt-4 border-t border-border-hairline">
        {phase === 'idle' && (
          <button
            type="button"
            onClick={generateAndPlay}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-body-sm font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base',
            )}
          >
            <Play size={14} />
            Generar y reproducir
          </button>
        )}

        {phase === 'generating' && (
          <div className="flex items-center justify-center gap-2 text-body-sm text-text-secondary py-3">
            <Loader2 size={14} className="animate-spin" />
            Aurora está armando el guión…
          </div>
        )}

        {(phase === 'ready' || phase === 'playing' || phase === 'paused') && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {phase === 'playing' ? (
                <button
                  type="button"
                  onClick={pause}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium',
                    'bg-accent text-text-inverse hover:bg-accent-muted',
                    'transition-colors duration-base',
                  )}
                >
                  <Pause size={14} />
                  Pausar
                </button>
              ) : phase === 'paused' ? (
                <button
                  type="button"
                  onClick={resume}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium',
                    'bg-accent text-text-inverse hover:bg-accent-muted',
                    'transition-colors duration-base',
                  )}
                >
                  <Play size={14} />
                  Reanudar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => playScript(script)}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-body-sm font-medium',
                    'bg-accent text-text-inverse hover:bg-accent-muted',
                    'transition-colors duration-base',
                  )}
                >
                  <Play size={14} />
                  Reproducir
                </button>
              )}
              {(phase === 'playing' || phase === 'paused') && (
                <button
                  type="button"
                  onClick={stop}
                  className={cn(
                    'px-3 py-2.5 text-caption',
                    'border border-border-hairline bg-bg-card text-text-secondary',
                    'hover:border-text-primary',
                    'transition-all duration-base',
                  )}
                >
                  Detener
                </button>
              )}
            </div>
            {script && (
              <details className="text-caption text-text-muted">
                <summary className="cursor-pointer hover:text-text-primary">
                  Ver guión
                </summary>
                <p className="mt-3 text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {script}
                </p>
              </details>
            )}
          </div>
        )}

        {error && (
          <p className="text-caption text-status-error mt-2">{error}</p>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Market intel grid + AI actions
// ─────────────────────────────────────────────────────────────

function MarketIntelGrid() {
  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <Kicker tone="muted">Inteligencia del mercado</Kicker>
          <h3 className="text-h2 text-text-primary mt-2">
            Movimientos clave esta semana
          </h3>
        </div>
        <span className="text-caption text-text-muted">
          Fuentes: Bloomberg LatAm · Refinitiv · CMF · scraping portales bancarios
        </span>
      </div>

      <div className="mt-8 space-y-6">
        {MARKET_INTEL.map((item) => (
          <IntelCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function IntelCard({ item }: { item: MarketIntelItem }) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <Card padding="lg">
      <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
        <span
          aria-hidden
          className={cn(
            'flex items-center justify-center w-10 h-10 shrink-0',
            item.severity === 'amenaza' && 'bg-status-warning-bg text-status-warning',
            item.severity === 'oportunidad' && 'bg-status-success-bg text-status-success',
            item.severity === 'neutral' && 'bg-bg-sunken text-text-secondary',
          )}
        >
          {item.severity === 'amenaza' ? (
            <TrendingUp size={16} />
          ) : item.severity === 'oportunidad' ? (
            <TrendingDown size={16} />
          ) : (
            <Newspaper size={16} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <Kicker tone="muted">{item.bank}</Kicker>
            <SeverityPill severity={item.severity} />
            <span className="text-caption text-text-muted tabular-nums">
              {formatDate(item.date)}
            </span>
          </div>
          <h4 className="text-h3 text-text-primary mt-2 leading-snug">
            {item.headline}
          </h4>
          <p className="text-body-sm text-text-secondary mt-3 leading-relaxed max-w-measure">
            {item.body}
          </p>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-caption text-text-muted">
              <span className="font-medium">Fuente:</span> {item.source}
            </span>
            <span aria-hidden className="text-text-muted">·</span>
            <span className="text-caption text-text-muted">{item.category}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border-hairline">
        {!actionsOpen ? (
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium',
              'border border-border-hairline bg-bg-card text-text-primary',
              'hover:border-accent hover:text-accent',
              'transition-all duration-base',
            )}
          >
            <Sparkles size={14} />
            Acciones sugeridas por Aurora
            <ArrowRight size={12} />
          </button>
        ) : (
          <ActionsBlock item={item} />
        )}
      </div>
    </Card>
  );
}

function SeverityPill({ severity }: { severity: MarketIntelItem['severity'] }) {
  if (severity === 'amenaza')
    return (
      <Pill variant="warning" size="sm">
        Amenaza
      </Pill>
    );
  if (severity === 'oportunidad')
    return (
      <Pill variant="success" size="sm">
        Oportunidad
      </Pill>
    );
  return (
    <Pill variant="neutral" size="sm">
      Neutral
    </Pill>
  );
}

function ActionsBlock({ item }: { item: MarketIntelItem }) {
  const [actions, setActions] = useState<CompetitiveActionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const response = await claudeCompletion(
          [{ role: 'user', content: buildCompetitiveActionsPrompt(item) }],
          COMPETITIVE_ACTIONS_SYSTEM,
          { maxTokens: 900, temperature: 0.5 },
        );
        const tagged = extractTagged(response, 'actions');
        const source = tagged ?? response;
        const parsed = extractStructured<CompetitiveActionsResult>(source);
        if (!cancelled) {
          setActions(parsed);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error inesperado');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center gap-2 text-body-sm text-text-secondary">
          <Loader2 size={14} className="animate-spin" />
          Aurora está pensando las acciones…
        </div>
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-body-sm text-status-error">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!actions?.actions?.length) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <Kicker tone="accent">Acciones sugeridas por Aurora</Kicker>
      <ol className="space-y-5">
        {actions.actions.map((action, i) => (
          <li key={i} className="flex gap-4">
            <span className="text-kicker text-accent-muted shrink-0 w-7 tabular-nums pt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-body text-text-primary font-medium leading-snug">
                {action.title}
              </div>
              <p className="text-body-sm text-text-secondary leading-relaxed max-w-measure">
                {action.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
                  <Target size={11} aria-hidden />
                  <span className="text-text-primary">{action.owner}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
                  <Calendar size={11} aria-hidden />
                  {action.horizon}
                </span>
                <span className="inline-flex items-center gap-1.5 text-caption text-text-muted">
                  <TrendingUp size={11} aria-hidden />
                  {action.expectedImpact}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
