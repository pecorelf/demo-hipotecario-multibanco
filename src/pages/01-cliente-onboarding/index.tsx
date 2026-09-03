import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, Send } from 'lucide-react';
import {
  Button,
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
  Skeleton,
} from '@/components/ui';
import { AiCursor, AiInsight, AiMessage, UserMessage } from '@/components/ai';
import { useClaudeStream } from '@/hooks/useClaude';
import { useTypewriter } from '@/hooks/useTypewriter';
import {
  ClaudeApiError,
  extractStructured,
  extractTagged,
} from '@/lib/claude';
import { ASSISTANT_SYSTEM } from '@/lib/prompts/assistant';
import {
  DEFAULT_FOLLOWUP_KEYS,
  ASSISTANT_FOLLOWUP_SYSTEM,
  buildAssistantFollowupPrompt,
  type FollowupResult,
} from '@/lib/prompts/assistantFollowup';
import {
  JOURNEY_LABEL,
  REGIME_LABEL,
  generateCaseId,
  validateCaseSetup,
} from '@/lib/journey';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';
import { useOperationStore } from '@/store/operationStore';
import type { OnboardingCase } from '@/types';
import { ClientLogin } from './ClientLogin';
import { CustomerCheck } from './CustomerCheck';
import { PostLoginChoice } from './PostLoginChoice';
import { BRAND } from '@/lib/brand';

const SUGGESTIONS = [
  'Compraré con mi pareja',
  'Es mi primera vivienda',
  'Vengo de una inmobiliaria con promesa firmada',
];

export default function ClienteOnboarding() {
  const navigate = useNavigate();
  const clientFlow = useAppStore((s) => s.clientFlow);
  const clientLoggedIn = useAppStore((s) => s.clientLoggedIn);
  const onboardingMode = useAppStore((s) => s.onboardingMode);
  const setOnboardingMode = useAppStore((s) => s.setOnboardingMode);
  const onboardingCase = useAppStore((s) => s.onboardingCase);
  const setOnboardingCase = useAppStore((s) => s.setOnboardingCase);
  const clearOnboardingCase = useAppStore((s) => s.clearOnboardingCase);
  const hydrateFromConversation = useOperationStore((s) => s.hydrateFromConversation);
  const setOpStage = useOperationStore((s) => s.setStage);

  if (clientFlow === 'unset') {
    return <CustomerCheck />;
  }

  if (!clientLoggedIn) {
    return <ClientLogin />;
  }

  // After login: ask if conversational or form (only if not yet chosen
  // and not already in a case)
  if (onboardingMode === 'unchosen' && !onboardingCase) {
    return (
      <PostLoginChoice
        onChooseConversational={() => {
          setOnboardingMode('conversational');
          setOpStage('in_conversation');
        }}
        onChooseForm={() => {
          setOnboardingMode('form');
          setOpStage('in_form');
          // If client had previously conversed something, pre-fill form
          hydrateFromConversation();
          navigate('/cliente/propiedad');
        }}
      />
    );
  }

  if (onboardingCase) {
    return <ModeB onboardingCase={onboardingCase} onReset={clearOnboardingCase} />;
  }

  return <ModeA onCaseCreated={setOnboardingCase} />;
}

// ─────────────────────────────────────────────────────────────
// Modo A — sin caso iniciado
// ─────────────────────────────────────────────────────────────

interface ModeAProps {
  onCaseCreated: (oc: OnboardingCase) => void;
}

function ModeA({ onCaseCreated }: ModeAProps) {
  const [input, setInput] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const stream = useClaudeStream();

  const visibleText = useMemo(() => {
    const openIdx = stream.text.indexOf('<case_setup>');
    return openIdx === -1 ? stream.text : stream.text.slice(0, openIdx).trimEnd();
  }, [stream.text]);
  const { displayed, isRevealing } = useTypewriter(visibleText, { charsPerSecond: 75 });

  const { parsedCase, parseError } = useMemo<{
    parsedCase: ReturnType<typeof validateCaseSetup> | null;
    parseError: string | null;
  }>(() => {
    if (stream.isStreaming || !stream.text) {
      return { parsedCase: null, parseError: null };
    }
    const tagged = extractTagged(stream.text, 'case_setup');
    if (!tagged) {
      return {
        parsedCase: null,
        parseError: `${BRAND.assistantName} no devolvió el bloque <case_setup>. Reintenta.`,
      };
    }
    try {
      const parsed = extractStructured(tagged, validateCaseSetup);
      return { parsedCase: parsed, parseError: null };
    } catch (err) {
      return { parsedCase: null, parseError: (err as Error).message };
    }
  }, [stream.text, stream.isStreaming]);

  useEffect(() => {
    if (!parsedCase || isRevealing || !submittedMessage) return;
    const timer = setTimeout(() => {
      onCaseCreated({
        ...parsedCase,
        id: generateCaseId(),
        createdAt: new Date().toISOString(),
        stage: 'solicitud',
        initialMessage: submittedMessage,
        eugeniaResponse: visibleText.trim(),
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [parsedCase, isRevealing, submittedMessage, visibleText, onCaseCreated]);

  function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || stream.isStreaming) return;
    setSubmittedMessage(trimmed);
    setInput('');
    stream.start({
      messages: [{ role: 'user', content: trimmed }],
      system: ASSISTANT_SYSTEM,
      maxTokens: 700,
      temperature: 0.6,
      cacheKey: 'eugenia_onboarding_pareja_casa',
    });
  }

  function handleRetry() {
    if (submittedMessage) handleSubmit(submittedMessage);
  }

  function handleReset() {
    stream.reset();
    setSubmittedMessage(null);
    setInput('');
  }

  if (!submittedMessage) {
    return <Hero input={input} setInput={setInput} onSubmit={handleSubmit} />;
  }

  return (
    <Conversation
      userText={submittedMessage}
      displayedText={displayed}
      isStreaming={stream.isStreaming}
      isRevealing={isRevealing}
      hasParsedCase={Boolean(parsedCase)}
      streamError={stream.error}
      parseError={parseError}
      onRetry={handleRetry}
      onReset={handleReset}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Hero (Modo A · estado inicial)
// ─────────────────────────────────────────────────────────────

interface HeroProps {
  input: string;
  setInput: (s: string) => void;
  onSubmit: (text: string) => void;
}

function Hero({ input, setInput, onSubmit }: HeroProps) {
  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-16 lg:py-24">
      <div className="max-w-3xl">
        <Kicker>Tu crédito hipotecario</Kicker>
        <PageTitle size="display-lg" className="mt-4">
          Empecemos por entender tu momento.
        </PageTitle>
        <p className="text-body-lg text-text-secondary mt-5 max-w-measure">
          No partimos por un formulario. Cuéntame qué estás buscando y armo el caso a tu medida —
          rescato lo que pueda rescatar yo, y sólo te pido lo que es indispensable.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </div>

      <div className="mt-12 max-w-3xl">
        <label htmlFor="onboarding-input" className="sr-only">
          Cuéntame qué estás buscando hacer
        </label>
        <div className="bg-bg-card border border-border-hairline focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 transition-all duration-base ease-out-soft">
          <textarea
            id="onboarding-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit(input);
              }
            }}
            rows={4}
            autoFocus
            placeholder="Cuéntame qué estás buscando hacer..."
            className="w-full bg-transparent px-6 py-5 text-body-lg text-text-primary placeholder:text-text-muted resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between px-6 py-3 border-t border-border-hairline">
            <span className="text-caption text-text-muted">⌘ / Ctrl + Enter para empezar</span>
            <Button
              onClick={() => onSubmit(input)}
              disabled={!input.trim()}
              iconRight={<Send size={14} />}
              size="sm"
            >
              Empezar
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Kicker tone="muted" className="block mb-3">
            O empieza por aquí
          </Kicker>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSubmit(s)}
                className={cn(
                  'inline-flex items-center px-3.5 py-2 text-body-sm text-text-secondary',
                  'border border-border-hairline bg-bg-card rounded-sm',
                  'hover:border-text-primary hover:text-text-primary',
                  'transition-all duration-base ease-out-soft',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Conversation (Modo A · post-submit, pre-Modo B)
// ─────────────────────────────────────────────────────────────

interface ConversationProps {
  userText: string;
  displayedText: string;
  isStreaming: boolean;
  isRevealing: boolean;
  hasParsedCase: boolean;
  streamError: ClaudeApiError | null;
  parseError: string | null;
  onRetry: () => void;
  onReset: () => void;
}

function Conversation({
  userText,
  displayedText,
  isStreaming,
  isRevealing,
  hasParsedCase,
  streamError,
  parseError,
  onRetry,
  onReset,
}: ConversationProps) {
  const showCursor = isStreaming || isRevealing;
  const showSkeleton = isStreaming && displayedText.length === 0 && !streamError;
  const showRetry =
    (Boolean(streamError) && streamError?.kind !== 'cancelled' && streamError?.message !== 'Aborted') ||
    (!isStreaming && !isRevealing && !hasParsedCase && Boolean(parseError));

  // Auto-scroll: mantener la parte inferior del texto visible mientras {BRAND.assistantName} escribe.
  // Estrategia doble para máxima fiabilidad:
  //   1. Effect que reacciona a cada cambio de displayedText
  //   2. Intervalo de polling durante streaming/reveal por si algún cambio se pierde
  const bottomRef = useRef<HTMLDivElement>(null);

  const performScroll = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      // Refuerzo: scroll del window al máximo, por si el contenedor padre
      // tiene su propio scroll que scrollIntoView no alcanza
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0 && window.scrollY < maxScroll - 50) {
        window.scrollTo({ top: maxScroll, behavior: 'auto' });
      }
    });
  };

  useEffect(() => {
    if (!isStreaming && !isRevealing && !showCursor) return;
    performScroll();
  }, [displayedText, showCursor, hasParsedCase, isStreaming, isRevealing]);

  // Polling defensivo: cada 80ms durante streaming/reveal aseguramos
  // que el scroll esté al final. Resuelve casos donde el effect anterior
  // no se dispara por timing.
  useEffect(() => {
    if (!isStreaming && !isRevealing) return;
    const id = window.setInterval(performScroll, 80);
    return () => window.clearInterval(id);
  }, [isStreaming, isRevealing]);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16">
      <div className="max-w-3xl">
        <Kicker>Tu crédito hipotecario · iniciando</Kicker>
        <PageTitle className="mt-3">{BRAND.assistantName} está armando tu caso</PageTitle>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </div>

      <div className="mt-12 max-w-3xl space-y-10">
        <UserMessage>{userText}</UserMessage>

        {showSkeleton ? (
          <div className="flex gap-4 max-w-measure">
            <span aria-hidden className="mt-[2px] w-[2px] bg-accent shrink-0 self-stretch" />
            <div className="flex flex-col gap-2 flex-1">
              <Kicker>{BRAND.assistantName} · Asistente</Kicker>
              <Skeleton className="h-4 w-2/5 mt-1" />
            </div>
          </div>
        ) : (
          (displayedText.length > 0 || streamError) && (
            <AiMessage label={`${BRAND.assistantName} · Asistente`} streaming={showCursor}>
              <span className="whitespace-pre-wrap">{displayedText}</span>
              {showCursor && <AiCursor />}
            </AiMessage>
          )
        )}

        {streamError && streamError.kind !== 'cancelled' && streamError.message !== 'Aborted' && (
          <AiInsight
            variant="error"
            message={streamError.message}
          />
        )}

        {(!streamError || streamError.kind === 'cancelled' || streamError.message === 'Aborted') && parseError && !isStreaming && !isRevealing && !hasParsedCase && (
          <AiInsight variant="warning" message={parseError} />
        )}

        {showRetry && (
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={onRetry} iconLeft={<RotateCcw size={14} />}>
              Reintentar
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Cambiar mi mensaje
            </Button>
          </div>
        )}

        {hasParsedCase && !isRevealing && (
          <div className="flex items-center gap-3 text-body-sm text-text-muted animate-fade-in">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-skeleton-pulse" />
            Preparando tu caso…
          </div>
        )}

        {/* Sentinel for auto-scroll while {BRAND.assistantName} streams */}
        <div ref={bottomRef} aria-hidden className="h-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modo B — caso ya iniciado
// ─────────────────────────────────────────────────────────────

interface ModeBProps {
  onboardingCase: OnboardingCase;
  onReset: () => void;
}

function ModeB({ onboardingCase: oc, onReset }: ModeBProps) {
  const navigate = useNavigate();
  const journeyLabel = JOURNEY_LABEL[oc.journeyType];
  const [allComplete, setAllComplete] = useState(false);

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16 animate-fade-in">
      <header className="max-w-3xl">
        <Kicker>
          Caso #{oc.id} · Evaluación
        </Kicker>
        <PageTitle className="mt-3">{journeyLabel}</PageTitle>
        {oc.keyFacts[0] && (
          <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
            {oc.keyFacts[0]}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-6">
          {oc.isCoTitular && (
            <Pill variant="info" size="sm">
              Co-titular{oc.coTitularName ? ` · ${oc.coTitularName}` : ''}
            </Pill>
          )}
          {oc.isCoTitular && oc.patrimonialRegime && (
            <Pill variant="neutral" size="sm">
              Régimen · {REGIME_LABEL[oc.patrimonialRegime]}
            </Pill>
          )}
          <Pill variant="neutral" size="sm">
            Etapa · Evaluación
          </Pill>
        </div>

        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-10" />
      </header>

      <div className="mt-12 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7">
          <ConversationCard oc={oc} onComplete={() => setAllComplete(true)} />
        </div>

        <Card padding="lg" className="col-span-12 lg:col-span-5 space-y-10">
          <SectionTitle>Próximos pasos</SectionTitle>

          {oc.dataToFetch.length > 0 && (
            <section>
              <Kicker tone="muted" className="block mb-4">
                Cuento ya con esta info
              </Kicker>
              <ol className="space-y-3">
                {oc.dataToFetch.map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body-sm text-text-secondary">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {oc.dataToAsk.length > 0 && (
            <section>
              <Kicker tone="muted" className="block mb-4">
                Qué necesito de ti
              </Kicker>
              <ol className="space-y-3">
                {oc.dataToAsk.map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="text-kicker text-accent-muted shrink-0 w-6 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body-sm text-text-secondary">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {oc.nextStep && (
            <section className="pt-2 border-t border-border-hairline">
              <Kicker tone="muted" className="block mb-3 mt-6">
                Lo siguiente
              </Kicker>
              <p className="text-body text-text-primary">{oc.nextStep}</p>
            </section>
          )}
        </Card>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/cliente/propiedad')}
          iconRight={<ArrowRight size={16} />}
        >
          {allComplete ? 'Continuar con datos de la propiedad' : 'Saltar a datos de propiedad'}
        </Button>
        <Button variant="ghost" onClick={onReset} iconLeft={<RotateCcw size={14} />}>
          Empezar de nuevo
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Conversation card — chat turn-by-turn with {BRAND.assistantName}
// ─────────────────────────────────────────────────────────────

interface ConversationCardProps {
  oc: OnboardingCase;
  onComplete: () => void;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  parsed?: FollowupResult;
}

function ConversationCard({ oc, onComplete }: ConversationCardProps) {
  const setOnboardingCase = useAppStore((s) => s.setOnboardingCase);
  const setOpConversation = useOperationStore((s) => s.setConversation);
  const setOpPlazoSolicitado = useOperationStore((s) => s.setPlazoSolicitado);
  const [turns, setTurns] = useState<ChatTurn[]>(() => [
    { role: 'user', content: oc.initialMessage },
    { role: 'assistant', content: oc.eugeniaResponse },
  ]);
  const [input, setInput] = useState('');
  const [pendingKeys, setPendingKeys] = useState<string[]>(DEFAULT_FOLLOWUP_KEYS);
  const [capturedSoFar, setCapturedSoFar] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [hasStartedFollowup, setHasStartedFollowup] = useState(false);
  const stream = useClaudeStream();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-trigger first follow-up question after a short pause
  useEffect(() => {
    if (hasStartedFollowup) return;
    setHasStartedFollowup(true);
    const t = setTimeout(() => askAssistant([]), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect streaming text into the last assistant turn (without JSON)
  useEffect(() => {
    if (!stream.text) return;
    setTurns((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      if (lastIdx >= 0 && next[lastIdx].role === 'assistant' && next[lastIdx].parsed === undefined) {
        const stripped = stream.text.replace(/<followup>[\s\S]*$/g, '').trimEnd();
        next[lastIdx] = { ...next[lastIdx], content: stripped };
      }
      return next;
    });
  }, [stream.text]);

  // When streaming finishes, parse the JSON and update tracking state
  useEffect(() => {
    if (stream.isStreaming || !stream.text) return;
    const last = turns[turns.length - 1];
    if (!last || last.role !== 'assistant' || last.parsed !== undefined) return;
    parseAndCommit(stream.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.isStreaming]);

  function parseAndCommit(rawText: string) {
    const tagged = extractTagged(rawText, 'followup');
    if (!tagged) {
      // No JSON — just commit the text as-is and finalize
      setTurns((prev) => {
        const next = [...prev];
        const i = next.length - 1;
        if (i >= 0 && next[i].role === 'assistant') {
          next[i] = { ...next[i], parsed: { capturedData: [], pendingDataKeys: pendingKeys, nextQuestion: '', isComplete: false } };
        }
        return next;
      });
      return;
    }
    try {
      const parsed = extractStructured<FollowupResult>(tagged);
      const updates: Record<string, string> = {};
      for (const item of parsed.capturedData ?? []) {
        if (item.field && item.value) updates[item.field] = item.value;
      }
      if (Object.keys(updates).length) {
        setCapturedSoFar((prev) => ({ ...prev, ...updates }));
        // ALSO propagate structured property data into the onboardingCase
        // so that /cliente/propiedad can prefill correctly
        const ocUpdates: Partial<OnboardingCase> = {};
        for (const item of parsed.capturedData ?? []) {
          if (!item.field || !item.value) continue;
          const val = item.value;
          if (item.field === 'propiedad_direccion' && !oc.propertyAddress) {
            const parsedAddr = parseAddressAndCommune(val);
            if (parsedAddr.address) ocUpdates.propertyAddress = parsedAddr.address;
            if (parsedAddr.commune) ocUpdates.propertyCommune = parsedAddr.commune;
            // Mirror to operation store
            setOpConversation({
              direccion: parsedAddr.address,
              comuna: parsedAddr.commune,
            });
          }
          if (item.field === 'valor_propiedad') {
            const num = extractUFNumber(val);
            if (num !== null) {
              ocUpdates.priceUF = num;
              setOpConversation({ valorPropiedadUF: num });
            }
          }
          if (item.field === 'pie_aportado') {
            const num = extractUFNumber(val);
            if (num !== null) {
              ocUpdates.downPaymentUF = num;
              // Calculate percentage if we have property value
              const propValue = ocUpdates.priceUF ?? oc.priceUF;
              if (propValue && propValue > 0) {
                const pct = Math.round((num / propValue) * 100);
                setOpConversation({ piePorcentaje: pct });
              }
            }
          }
          if (item.field === 'plazo') {
            const yrs = extractYears(val);
            if (yrs !== null) {
              ocUpdates.termYears = yrs;
              setOpConversation({ plazoSolicitadoAnios: yrs });
              setOpPlazoSolicitado(yrs);
            }
          }
          if (item.field === 'regimen_patrimonial') {
            setOpConversation({ regimenPatrimonial: val });
          }
          if (item.field === 'fecha_promesa') {
            setOpConversation({ fechaPromesa: val });
          }
          if (item.field === 'urgencia') {
            setOpConversation({ urgencia: val });
          }
        }
        if (Object.keys(ocUpdates).length) {
          setOnboardingCase({ ...oc, ...ocUpdates });
        }
      }
      if (parsed.pendingDataKeys) setPendingKeys(parsed.pendingDataKeys);
      const cleanContent = rawText.replace(/<followup>[\s\S]*?<\/followup>/g, '').trim();
      setTurns((prev) => {
        const next = [...prev];
        const i = next.length - 1;
        if (i >= 0 && next[i].role === 'assistant') {
          next[i] = { ...next[i], content: cleanContent, parsed };
        }
        return next;
      });
      if (parsed.isComplete) {
        setIsComplete(true);
        onComplete();
      }
    } catch {
      // ignore parse errors
    }
  }

  function askAssistant(extraTurns: ChatTurn[]) {
    const history = [...turns, ...extraTurns].slice(2).map((t) => ({
      role: t.role,
      content: t.content,
    }));

    setTurns((prev) => [...prev, { role: 'assistant', content: '' }]);

    stream.start({
      messages: [
        {
          role: 'user',
          content: buildAssistantFollowupPrompt({
            onboardingCase: oc,
            history,
            capturedSoFar,
            pendingKeys,
          }),
        },
      ],
      system: ASSISTANT_FOLLOWUP_SYSTEM,
      maxTokens: 500,
      temperature: 0.5,
      cacheKey: extraTurns.length === 0 ? 'eugenia_followup_first_question' : undefined,
    });
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || stream.isStreaming || isComplete) return;
    setInput('');
    const userTurn: ChatTurn = { role: 'user', content: trimmed };
    setTurns((prev) => [...prev, userTurn]);
    askAssistant([userTurn]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
  }

  return (
    <Card padding="lg" className="space-y-8">
      <SectionTitle>Nuestra conversación</SectionTitle>

      <div className="space-y-6">
        {turns.map((turn, idx) => {
          const isLast = idx === turns.length - 1;
          const isStreamingThis = isLast && turn.role === 'assistant' && stream.isStreaming;

          if (turn.role === 'user') {
            return <UserMessage key={idx}>{turn.content}</UserMessage>;
          }

          if (turn.content === '' && isStreamingThis) {
            return (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            );
          }

          return (
            <AiMessage
              key={idx}
              label={idx === 1 ? `${BRAND.assistantName} · Asistente` : BRAND.assistantName}
              streaming={isStreamingThis}
            >
              <span className="whitespace-pre-wrap">{turn.content}</span>
              {isStreamingThis && <AiCursor />}
            </AiMessage>
          );
        })}

        {Object.keys(capturedSoFar).length > 0 && (
          <div className="pt-2">
            <Kicker tone="muted" className="block mb-2">
              Lo que vamos llevando
            </Kicker>
            <div className="flex flex-wrap gap-2">
              {Object.entries(capturedSoFar).map(([key, value]) => (
                <Pill key={key} variant="success" size="sm">
                  ✓ {labelForField(key)}: {truncate(value, 50)}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} aria-hidden />
      </div>

      {isComplete ? (
        <AiInsight
          variant="success"
          message="Ya tengo lo que necesito. Cuando estés listo, continúa al siguiente paso."
        />
      ) : stream.error && stream.error.kind !== 'cancelled' && stream.error.message !== 'Aborted' ? (
        <AiInsight variant="error" message={stream.error.message} />
      ) : (
        <div className="pt-4 border-t border-border-hairline">
          <div className="flex gap-3 items-start">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Escribe tu respuesta a ${BRAND.assistantName}…`}
              rows={2}
              disabled={stream.isStreaming || isComplete}
              className={cn(
                'flex-1 bg-bg-page border border-border-hairline',
                'px-4 py-3 text-body-sm text-text-primary',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                'resize-none disabled:opacity-50',
              )}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || stream.isStreaming || isComplete}
              className={cn(
                'inline-flex items-center justify-center p-3 shrink-0',
                'bg-accent text-text-inverse',
                'hover:bg-accent-muted transition-colors duration-base',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
              aria-label="Enviar respuesta"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-caption text-text-muted mt-2">
            Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      )}
    </Card>
  );
}

function labelForField(field: string): string {
  switch (field) {
    case 'regimen_patrimonial':
      return 'Régimen';
    case 'valor_propiedad':
      return 'Valor propiedad';
    case 'pie_aportado':
      return 'Pie';
    case 'plazo':
      return 'Plazo';
    case 'propiedad_direccion':
      return 'Dirección';
    case 'cotitular_autenticado':
      return 'Co-titular';
    case 'fecha_promesa':
      return 'Promesa';
    case 'urgencia':
      return 'Urgencia';
    default:
      return field.replace(/_/g, ' ');
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─────────────────────────────────────────────────────────────
// Helpers to extract structured data from free-text captured by {BRAND.assistantName}
// ─────────────────────────────────────────────────────────────

const RM_COMUNAS = [
  'Providencia', 'Vitacura', 'Lo Barnechea', 'Providencia', 'Ñuñoa',
  'La Reina', 'Macul', 'Peñalolén', 'Santiago Centro', 'Santiago',
  'La Florida', 'Maipú', 'Estación Central', 'San Miguel', 'Recoleta',
  'Independencia', 'Huechuraba', 'Quilicura', 'Colina', 'Chicureo',
];

function parseAddressAndCommune(text: string): { address: string; commune: string } {
  if (!text) return { address: '', commune: '' };

  let foundCommune = '';
  for (const c of RM_COMUNAS) {
    if (text.toLowerCase().includes(c.toLowerCase())) {
      foundCommune = c;
      break;
    }
  }

  let foundAddress = '';
  const addrPatterns = [
    /\b(?:av\.?|avenida|calle|pasaje|psje\.?)\s+([a-záéíóúñ][\wáéíóúñ\s\-.]{2,40}?\s+\d{1,5}[a-z]?)/i,
    /\b([a-záéíóúñ][\wáéíóúñ\s\-.]{2,40}?\s+\d{2,5})\b/i,
  ];
  for (const re of addrPatterns) {
    const m = text.match(re);
    if (m) {
      foundAddress = m[0].trim();
      break;
    }
  }

  return { address: foundAddress, commune: foundCommune };
}

/** Extract a UF amount from text like "UF 6800", "6.800 UF", "$200 millones", etc. */
function extractUFNumber(text: string): number | null {
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/[.,](?=\d{3}\b)/g, '');
  // Patterns: "uf 6800", "6800 uf", "$200 millones", "200 millones de pesos"
  const ufMatch = normalized.match(/(?:uf\s*)(\d{3,6})|(\d{3,6})\s*uf/);
  if (ufMatch) {
    const n = parseInt(ufMatch[1] || ufMatch[2], 10);
    if (n >= 100 && n <= 100000) return n;
  }
  // Pesos in millions: "200 millones", "$200.000.000"
  const millonesMatch = normalized.match(/(\d{1,4})\s*millones?/);
  if (millonesMatch) {
    const millones = parseInt(millonesMatch[1], 10);
    if (millones >= 10 && millones <= 5000) {
      return Math.round((millones * 1_000_000) / 40_424.99);
    }
  }
  return null;
}

/** Extract years from text like "25 años", "30 anos", "a 20 años plazo" */
function extractYears(text: string): number | null {
  if (!text) return null;
  const match = text.toLowerCase().match(/(\d{1,2})\s*a[nñ]os/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 5 && n <= 40) return n;
  }
  return null;
}
