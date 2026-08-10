import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Circle, Home, MapPin, Wallet } from 'lucide-react';
import { Card, Kicker, PageTitle } from '@/components/ui';
import { cn } from '@/lib/cn';
import { UF_CLP_RATE, formatCLP } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { useOperationStore } from '@/store/operationStore';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Property input — cliente ingresa la propiedad que quiere comprar
// ─────────────────────────────────────────────────────────────

const COMUNAS_RM = [
  'Providencia', 'Vitacura', 'Lo Barnechea', 'Providencia', 'Ñuñoa',
  'La Reina', 'Macul', 'Peñalolén', 'Santiago Centro', 'Santiago',
  'La Florida', 'Maipú', 'Estación Central', 'San Miguel', 'Recoleta',
  'Independencia', 'Huechuraba', 'Quilicura', 'Colina', 'Chicureo',
];

/**
 * Intenta extraer dirección y comuna de un texto libre escrito por el cliente
 * en el chat con {BRAND.assistantName}. Tolerante: si no encuentra nada, devuelve strings vacíos.
 */
function parsePropertyFromText(...texts: (string | undefined)[]): {
  address: string;
  commune: string;
} {
  const combined = texts.filter(Boolean).join(' · ').toLowerCase();
  if (!combined) return { address: '', commune: '' };

  // Find commune by matching against known list
  let foundCommune = '';
  for (const c of COMUNAS_RM) {
    if (combined.includes(c.toLowerCase())) {
      foundCommune = c;
      break;
    }
  }

  // Find address: match patterns like "Av./Avenida/Calle X N"
  let foundAddress = '';
  const addrPatterns = [
    /\b(?:av\.?|avenida|calle|pasaje|psje\.?)\s+([a-záéíóúñ][\wáéíóúñ\s\-.]{2,40}?\s+\d{1,5}[a-z]?)/i,
    /\b([a-záéíóúñ][\wáéíóúñ\s\-.]{2,40}?\s+\d{2,5})\b/i,
  ];
  // Use the original (non-lowercased) text for the address to preserve casing
  const original = texts.filter(Boolean).join(' · ');
  for (const re of addrPatterns) {
    const m = original.match(re);
    if (m) {
      foundAddress = m[0].trim();
      break;
    }
  }

  return { address: foundAddress, commune: foundCommune };
}

export function PropertyInputScreen() {
  const navigate = useNavigate();
  const setPropertyInput = useAppStore((s) => s.setPropertyInput);
  const propertyInput = useAppStore((s) => s.propertyInput);
  const onboardingCase = useAppStore((s) => s.onboardingCase);

  // From the shared operationStore (single source of truth for what the
  // client conversed with {BRAND.assistantName}, even if there's no onboardingCase)
  const opConversation = useOperationStore((s) => s.conversation);
  const opProperty = useOperationStore((s) => s.property);
  const setOpProperty = useOperationStore((s) => s.setProperty);

  // Prefill source priority:
  //   1. propertyInput from store (if user is coming back to this screen)
  //   2. operationStore.property (e.g. came from PostLoginChoice → form)
  //   3. operationStore.conversation (what {BRAND.assistantName} captured)
  //   4. Structured fields captured by {BRAND.assistantName} (propertyAddress, priceUF, etc.)
  //   5. Text parsing of {BRAND.assistantName}'s keyFacts as a fallback
  //   6. Empty
  const prefilled = (() => {
    if (propertyInput) {
      return {
        address: propertyInput.address,
        commune: propertyInput.commune,
        price: propertyInput.priceUF.toString(),
        down: propertyInput.downPaymentUF.toString(),
      };
    }
    // operationStore.property (set when client navigated from form choice)
    if (opProperty.direccion || opProperty.comuna || opProperty.valorUF) {
      const dirVal = opProperty.direccion ?? '';
      const comVal = opProperty.comuna ?? '';
      const priceVal = opProperty.valorUF ? opProperty.valorUF.toString() : '';
      const downVal = opProperty.valorUF && opProperty.piePorcentaje
        ? Math.round((opProperty.valorUF * opProperty.piePorcentaje) / 100).toString()
        : '';
      if (dirVal || comVal || priceVal) {
        return { address: dirVal, commune: comVal, price: priceVal, down: downVal };
      }
    }
    // operationStore.conversation (what {BRAND.assistantName} captured but never made it into onboardingCase)
    if (opConversation.direccion || opConversation.comuna || opConversation.valorPropiedadUF) {
      const dirVal = opConversation.direccion ?? '';
      const comVal = opConversation.comuna ?? '';
      const priceVal = opConversation.valorPropiedadUF ? opConversation.valorPropiedadUF.toString() : '';
      const downVal = opConversation.valorPropiedadUF && opConversation.piePorcentaje
        ? Math.round((opConversation.valorPropiedadUF * opConversation.piePorcentaje) / 100).toString()
        : '';
      if (dirVal || comVal || priceVal) {
        return { address: dirVal, commune: comVal, price: priceVal, down: downVal };
      }
    }
    if (onboardingCase) {
      // First: try the structured fields {BRAND.assistantName} captured
      const eugeniaAddress = onboardingCase.propertyAddress ?? '';
      const eugeniaCommune = onboardingCase.propertyCommune ?? '';
      const eugeniaPrice = onboardingCase.priceUF ?? null;
      const eugeniaDown = onboardingCase.downPaymentUF ?? null;

      // If at least one structured field exists, use those (filling gaps with text parsing)
      if (eugeniaAddress || eugeniaCommune || eugeniaPrice || eugeniaDown) {
        // Use text parsing only as gap-filler for missing address/commune
        const parsed =
          !eugeniaAddress || !eugeniaCommune
            ? parsePropertyFromText(
                onboardingCase.initialMessage,
                ...(onboardingCase.keyFacts || []),
              )
            : { address: '', commune: '' };
        return {
          address: eugeniaAddress || parsed.address,
          commune: eugeniaCommune || parsed.commune,
          price: eugeniaPrice ? eugeniaPrice.toString() : '',
          down: eugeniaDown ? eugeniaDown.toString() : '',
        };
      }

      // Fallback: pure text parsing
      const parsed = parsePropertyFromText(
        onboardingCase.initialMessage,
        ...(onboardingCase.keyFacts || []),
      );
      return { ...parsed, price: '', down: '' };
    }
    return { address: '', commune: '', price: '', down: '' };
  })();

  const [address, setAddress] = useState(prefilled.address);
  const [commune, setCommune] = useState(prefilled.commune);
  const [priceUF, setPriceUF] = useState<string>(prefilled.price);
  const [downPaymentUF, setDownPaymentUF] = useState<string>(prefilled.down);

  const priceNum = parseFloat(priceUF) || 0;
  const downNum = parseFloat(downPaymentUF) || 0;
  const loanUF = Math.max(0, priceNum - downNum);
  const ltvPct = priceNum > 0 ? (loanUF / priceNum) * 100 : 0;

  const priceCLP = priceNum * UF_CLP_RATE;
  const downCLP = downNum * UF_CLP_RATE;
  const loanCLP = loanUF * UF_CLP_RATE;

  // Validations
  const addressOk = address.trim().length >= 5;
  const communeOk = commune.trim().length >= 3;
  const priceOk = priceNum >= 500 && priceNum <= 100000;
  const downOk = downNum > 0 && downNum >= priceNum * 0.05 && downNum < priceNum;
  const ltvOk = ltvPct > 0 && ltvPct <= 95;

  const allOk = addressOk && communeOk && priceOk && downOk && ltvOk;

  // Build list of what's missing/wrong, to surface to the user
  const issues: string[] = [];
  if (!addressOk && address.length > 0) issues.push('La dirección parece muy corta. Ingresa calle y número.');
  if (!communeOk && commune.length > 0) issues.push('Indica la comuna.');
  if (priceNum > 0 && !priceOk) {
    issues.push(`El precio debe estar entre UF 500 y UF 100.000. Ingresaste UF ${priceNum.toLocaleString('es-CL')}.`);
  }
  if (priceOk && downNum > 0 && !downOk) {
    if (downNum >= priceNum) {
      issues.push(`Tu pie no puede ser igual o mayor al precio. Pie debe ser menor a UF ${priceNum.toLocaleString('es-CL')}.`);
    } else if (downNum < priceNum * 0.05) {
      issues.push(`El pie mínimo es 5% del precio, es decir UF ${Math.ceil(priceNum * 0.05).toLocaleString('es-CL')}.`);
    }
  }

  // Persist in store while typing (only when all fields are valid)
  useEffect(() => {
    if (allOk) {
      setPropertyInput({
        address: address.trim(),
        commune: commune.trim(),
        priceUF: priceNum,
        downPaymentUF: downNum,
        loanAmountUF: loanUF,
      });
      // Also mirror to shared operation store so executive views see it
      setOpProperty({
        direccion: address.trim(),
        comuna: commune.trim(),
        valorUF: priceNum,
        piePorcentaje: priceNum > 0 ? Math.round((downNum / priceNum) * 100) : undefined,
      });
    }
  }, [allOk, address, commune, priceNum, downNum, loanUF, setPropertyInput, setOpProperty]);

  function handleContinue() {
    if (!allOk) return;
    setPropertyInput({
      address: address.trim(),
      commune: commune.trim(),
      priceUF: priceNum,
      downPaymentUF: downNum,
      loanAmountUF: loanUF,
    });
    navigate('/cliente/documentos');
  }

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-16 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate('/cliente')}
        className="inline-flex items-center gap-2 text-body-sm text-text-secondary hover:text-text-primary transition-colors duration-base"
      >
        <ArrowLeft size={14} />
        Volver
      </button>

      <header className="max-w-3xl mt-10">
        <Kicker>Datos del inmueble</Kicker>
        <PageTitle className="mt-3">¿Qué propiedad quieres comprar?</PageTitle>
        <p className="text-body-lg text-text-secondary mt-3 max-w-measure">
          Necesitamos saber dónde está, cuánto cuesta y cuánto puedes aportar
          como pie. Con eso preparamos tus escenarios y te guiamos en los
          siguientes pasos.
        </p>
        <span aria-hidden className="block w-12 h-px bg-border-hairline mt-8" />
      </header>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Form */}
        <Card padding="lg" className="space-y-8">
          <FormGroup
            icon={<MapPin size={16} />}
            label="Dirección"
            hint="Calle y número"
          >
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Vitacura 2950"
              className={inputClass}
              autoFocus
            />
          </FormGroup>

          <FormGroup icon={<Home size={16} />} label="Comuna">
            <input
              type="text"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              placeholder="Vitacura"
              className={inputClass}
              list="comunas-rm"
            />
            <datalist id="comunas-rm">
              <option value="Providencia" />
              <option value="Vitacura" />
              <option value="Lo Barnechea" />
              <option value="Providencia" />
              <option value="Ñuñoa" />
              <option value="La Reina" />
              <option value="Macul" />
              <option value="Peñalolén" />
              <option value="Santiago Centro" />
              <option value="La Florida" />
              <option value="Maipú" />
              <option value="Estación Central" />
            </datalist>
          </FormGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup
              icon={<Wallet size={16} />}
              label="Precio de la propiedad"
              hint="en UF"
            >
              <input
                type="number"
                inputMode="numeric"
                min={1000}
                max={50000}
                value={priceUF}
                onChange={(e) => setPriceUF(e.target.value)}
                placeholder="6.800"
                className={inputClass}
              />
              {priceNum > 0 && (
                <p className="text-caption text-text-muted mt-1.5 tabular-nums">
                  Equivale a {formatCLP(priceCLP)}
                </p>
              )}
            </FormGroup>

            <FormGroup label="Pie que aportas" hint="en UF (mínimo 10%)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={50000}
                value={downPaymentUF}
                onChange={(e) => setDownPaymentUF(e.target.value)}
                placeholder="2.040"
                className={inputClass}
              />
              {downNum > 0 && (
                <p className="text-caption text-text-muted mt-1.5 tabular-nums">
                  Equivale a {formatCLP(downCLP)}
                </p>
              )}
            </FormGroup>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!allOk}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 text-body font-medium',
              'bg-accent text-text-inverse',
              'hover:bg-accent-muted transition-colors duration-base',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
            )}
          >
            Continuar
            <ArrowRight size={16} />
          </button>

          {!allOk && (
            <div className="pt-4 border-t border-border-hairline space-y-3">
              <div className="text-caption text-text-muted">
                Para continuar necesitamos que completes:
              </div>
              <ul className="space-y-1.5 text-caption">
                <ValidationItem ok={addressOk} label="Dirección" />
                <ValidationItem ok={communeOk} label="Comuna" />
                <ValidationItem ok={priceOk} label="Precio de la propiedad (entre UF 500 y UF 100.000)" />
                <ValidationItem ok={downOk} label="Pie que aportas (al menos 5% del precio)" />
              </ul>
              {issues.length > 0 && (
                <ul className="space-y-1 text-caption text-status-warning pt-2 border-t border-border-hairline">
                  {issues.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        {/* Side preview */}
        <aside>
          <Card padding="lg" className="space-y-6 sticky top-6">
            <Kicker tone="muted">Resumen de tu operación</Kicker>

            <div className="space-y-4 text-body-sm">
              <SummaryRow
                label="Propiedad"
                value={
                  address || commune
                    ? `${address || '—'}${commune ? ', ' + commune : ''}`
                    : '—'
                }
              />
              <SummaryRow
                label="Valor de la propiedad"
                value={
                  priceNum > 0
                    ? `UF ${priceNum.toLocaleString('es-CL')}`
                    : '—'
                }
                clpHint={priceNum > 0 ? formatCLP(priceCLP) : undefined}
              />
              <SummaryRow
                label="Pie que aportas"
                value={
                  downNum > 0
                    ? `UF ${downNum.toLocaleString('es-CL')}`
                    : '—'
                }
                clpHint={downNum > 0 ? formatCLP(downCLP) : undefined}
                hint={
                  priceNum > 0 && downNum > 0
                    ? `${((downNum / priceNum) * 100).toFixed(0)}% del valor`
                    : undefined
                }
              />

              <div className="pt-4 border-t border-border-hairline space-y-3">
                <div>
                  <div className="text-caption uppercase tracking-[0.14em] text-text-muted">
                    Crédito a solicitar
                  </div>
                  <div className="mt-1 text-h2 text-text-primary tabular-nums">
                    UF {loanUF.toLocaleString('es-CL')}
                  </div>
                  {loanCLP > 0 && (
                    <div className="text-caption text-text-muted tabular-nums mt-0.5">
                      {formatCLP(loanCLP)}
                    </div>
                  )}
                  {priceNum > 0 && (
                    <div className="text-caption text-text-muted mt-2">
                      LTV {ltvPct.toFixed(0)}% sobre valor de tasación
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-caption text-text-muted pt-4 border-t border-border-hairline leading-relaxed">
              UF al 20 de mayo de 2026:{' '}
              <span className="tabular-nums text-text-primary">
                ${UF_CLP_RATE.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
              </span>
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

const inputClass = cn(
  'w-full bg-bg-card border border-border-hairline',
  'px-4 py-3 text-body text-text-primary',
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15',
  'placeholder:text-text-muted tabular-nums',
);

function FormGroup({
  icon,
  label,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-baseline gap-2">
        {icon && (
          <span aria-hidden className="text-text-secondary">
            {icon}
          </span>
        )}
        <span className="text-body-sm text-text-primary font-medium">{label}</span>
        {hint && <span className="text-caption text-text-muted">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  clpHint,
  hint,
}: {
  label: string;
  value: string;
  clpHint?: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-caption uppercase tracking-[0.14em] text-text-muted">
        {label}
      </dt>
      <dd className="text-body text-text-primary mt-1 tabular-nums">{value}</dd>
      {clpHint && (
        <div className="text-caption text-text-muted tabular-nums">{clpHint}</div>
      )}
      {hint && <div className="text-caption text-text-muted">{hint}</div>}
    </div>
  );
}

function ValidationItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <Check size={11} className="text-status-success shrink-0" aria-hidden />
      ) : (
        <Circle size={11} className="text-text-muted shrink-0" aria-hidden />
      )}
      <span className={ok ? 'text-text-secondary' : 'text-text-muted'}>{label}</span>
    </li>
  );
}
