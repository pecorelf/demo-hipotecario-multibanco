import { useState } from 'react';
import { Send, Square, RotateCcw } from 'lucide-react';
import { useClaudeStream } from '@/hooks/useClaude';
import { CLAUDE_MODEL } from '@/lib/claude';
import { AiCursor, AiInsight, AiMessage, UserMessage } from '@/components/ai';
import {
  Button,
  Card,
  Kicker,
  PageTitle,
  Pill,
  SectionTitle,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { BRAND } from '@/lib/brand';

const DEFAULT_SYSTEM =
  `Eres el asistente hipotecario de ${BRAND.name}. Respondes en español de Chile, breve y profesional. Cuando entregues cifras usa UF y CLP cuando corresponda.`;

const DEFAULT_PROMPT =
  'Resume en 3 líneas qué documentos necesita un cliente dependiente para iniciar una solicitud hipotecaria en Chile.';

export default function TestPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const stream = useClaudeStream();

  function handleSend() {
    const trimmed = prompt.trim();
    if (!trimmed || stream.isStreaming) return;
    setLastSubmitted(trimmed);
    stream.start({
      messages: [{ role: 'user', content: trimmed }],
      system: system.trim() || undefined,
      maxTokens: 800,
    });
  }

  const status: { label: string; variant: 'neutral' | 'info' | 'success' | 'error' } =
    stream.error
      ? { label: 'Error', variant: 'error' }
      : stream.isStreaming
        ? { label: 'En streaming', variant: 'info' }
        : stream.text
          ? { label: 'Completado', variant: 'success' }
          : { label: 'Inactivo', variant: 'neutral' };

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12">
      <header className="max-w-measure">
        <Kicker>Diagnóstico · Claude API</Kicker>
        <PageTitle className="mt-3">Test de conexión</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3">
          Esta pantalla no va a la demo. Sirve para verificar que la integración con
          la API funciona en tu entorno antes de construir las pantallas reales.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      <div className="mt-12 grid grid-cols-12 gap-8">
        <Card className="col-span-12 lg:col-span-7 space-y-6" padding="lg">
          <SectionTitle>Prompt</SectionTitle>

          <div className="space-y-2">
            <label
              htmlFor="system"
              className="text-body-sm text-text-secondary block"
            >
              System prompt
            </label>
            <textarea
              id="system"
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              rows={3}
              className={cn(
                'w-full bg-bg-card border border-border-hairline',
                'px-4 py-3 text-body-sm text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                'transition-all duration-base ease-out-soft resize-none',
              )}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="prompt"
              className="text-body-sm text-text-secondary block"
            >
              Mensaje del usuario
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className={cn(
                'w-full bg-bg-card border border-border-hairline',
                'px-4 py-3 text-body text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
                'transition-all duration-base ease-out-soft resize-none',
              )}
            />
            <p className="text-caption text-text-muted">⌘/Ctrl + Enter para enviar</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSend}
              disabled={stream.isStreaming || !prompt.trim()}
              iconLeft={<Send size={16} />}
            >
              Preguntar a Claude
            </Button>
            {stream.isStreaming && (
              <Button
                variant="secondary"
                onClick={stream.cancel}
                iconLeft={<Square size={14} />}
              >
                Cancelar
              </Button>
            )}
            {!stream.isStreaming && (stream.text || stream.error) && (
              <Button
                variant="ghost"
                onClick={stream.reset}
                iconLeft={<RotateCcw size={14} />}
              >
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-5 space-y-4">
          <Card padding="sm" className="space-y-4">
            <Kicker tone="muted">Estado</Kicker>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Conexión</span>
                <Pill variant={status.variant} size="sm">
                  {status.label}
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Modelo</span>
                <span className="text-body-sm text-text-primary font-mono">
                  {CLAUDE_MODEL}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Tokens recibidos</span>
                <span className="text-body-sm text-text-primary tabular-nums">
                  ~{Math.ceil(stream.text.length / 4)}
                </span>
              </div>
            </div>
          </Card>

          <Card padding="sm" className="space-y-3">
            <Kicker tone="muted">Cómo se prueba</Kicker>
            <ol className="space-y-2 text-body-sm text-text-secondary">
              <li>1. Verifica que <code className="text-text-primary">.env.local</code> tenga <code className="text-text-primary">VITE_ANTHROPIC_API_KEY</code>.</li>
              <li>2. Escribe un prompt y presiona <em>Preguntar a Claude</em>.</li>
              <li>3. El texto debe aparecer palabra por palabra con cursor pulsante al final.</li>
              <li>4. Cancela en medio — el stream debe detenerse limpio.</li>
            </ol>
          </Card>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <SectionTitle>Respuesta</SectionTitle>

        {!stream.text && !stream.error && !stream.isStreaming && (
          <p className="text-body text-text-muted max-w-measure">
            Sin respuesta todavía. Envía un prompt arriba para ver el streaming en vivo.
          </p>
        )}

        {stream.error && (
          <AiInsight
            variant="error"
            message={
              <>
                <strong className="text-text-primary">[{stream.error.kind}]</strong>{' '}
                {stream.error.message}
              </>
            }
          />
        )}

        {(stream.text || stream.isStreaming) && (
          <div className="space-y-6">
            {lastSubmitted && <UserMessage>{lastSubmitted}</UserMessage>}
            <AiMessage streaming={stream.isStreaming}>
              <span className="whitespace-pre-wrap">{stream.text}</span>
              {stream.isStreaming && <AiCursor />}
            </AiMessage>
          </div>
        )}
      </div>
    </div>
  );
}
