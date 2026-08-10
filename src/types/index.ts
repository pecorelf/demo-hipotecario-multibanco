import { BRAND } from '@/lib/brand';

export type Role = 'cliente' | 'ejecutivo' | 'backoffice' | 'jefatura' | 'operaciones' | 'gobierno' | 'inmobiliaria';

// ─────────────────────────────────────────────────────────────
// Claude API
// ─────────────────────────────────────────────────────────────

export type ClaudeRole = 'user' | 'assistant';

export interface ClaudeMessage {
  role: ClaudeRole;
  content: string;
}

// ─────────────────────────────────────────────────────────────
// Actores
// ─────────────────────────────────────────────────────────────

export type ActorKind = 'cliente' | 'ejecutivo' | 'backoffice' | 'sistema' | 'agente';

export interface Agent {
  kind: ActorKind;
  name?: string;
  id?: string;
}

// ─────────────────────────────────────────────────────────────
// Personas
// ─────────────────────────────────────────────────────────────

export type MaritalStatus =
  | 'soltero'
  | 'casado_sociedad_conyugal'
  | 'casado_separacion_bienes'
  | 'casado_participacion_gananciales'
  | 'conviviente_civil'
  | 'divorciado'
  | 'viudo';

export type EmploymentKind = 'dependiente' | 'independiente';

export interface Employment {
  kind: EmploymentKind;
  employer?: string;
  position?: string;
  tenureMonths?: number;
  netMonthlyCLP: number;
  variabilityNote?: string;
}

export type AfpName = 'Habitat' | 'Cuprum' | 'Provida' | 'Capital' | 'PlanVital' | 'Modelo' | 'Uno';

export interface Customer {
  id: string;
  fullName: string;
  rut: string;
  email: string;
  phone: string;
  birthDate: string;
  maritalStatus: MaritalStatus;
  afp: AfpName;
  employment: Employment;
  address: string;
  commune: string;
}

export interface Executive {
  id: string;
  fullName: string;
  rut: string;
  email: string;
  branch: string;
}

// ─────────────────────────────────────────────────────────────
// Caso hipotecario
// ─────────────────────────────────────────────────────────────

export type CaseStage =
  | 'solicitud'
  | 'cotizacion_inicial'
  | 'recopilacion'
  | 'cotizacion_final'
  | 'tasacion'
  | 'escrituracion'
  | 'activacion';

export type DocumentStatus = 'pendiente' | 'recibido' | 'validado' | 'rechazado';

export type DocumentKind =
  | 'cedula'
  | 'liquidacion'
  | 'previred'
  | 'preaprobacion'
  | 'certificado_matrimonio'
  | 'certificado_afp'
  | 'tasacion'
  | 'reglamento'
  | 'cotizacion'
  | 'declaracion_renta'
  | 'contrato_promesa';

export interface Document {
  id: string;
  caseId: string;
  kind: DocumentKind;
  label: string;
  status: DocumentStatus;
  uploadedAt?: string;
  validatedAt?: string;
  uploadedBy?: ActorKind;
  notes?: string;
  extractedData?: Record<string, unknown>;
}

export type TimelineEventType =
  | 'solicitud_creada'
  | 'preaprobacion'
  | 'firma_contrato'
  | 'identidad_verificada'
  | 'documento_subido'
  | 'documento_validado'
  | 'ingreso_validado'
  | 'cruce_bureau'
  | 'asignacion_caso'
  | 'solicitud_documento'
  | 'observacion_ia'
  | 'cambio_etapa'
  | 'mensaje'
  | 'resolucion';

export type TimelineState = 'done' | 'current' | 'pending';

export interface TimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  actor: Agent;
  type: TimelineEventType;
  title: string;
  detail?: string;
  state?: TimelineState;
  metadata?: Record<string, unknown>;
}

export interface PropertyInfo {
  address: string;
  commune: string;
  type: 'departamento' | 'casa';
  valueUF: number;
  bedrooms?: number;
  bathrooms?: number;
  surfaceM2?: number;
  developer?: string;
  realEstate?: string;
}

export interface PromesaContract {
  signedAt: string;
  amountUF: number;
  notary?: string;
  reference?: string;
}

export interface Case {
  id: string;
  customerId: string;
  coTitularId?: string;
  executiveId: string;
  stage: CaseStage;
  requestedUF: number;
  downPaymentUF: number;
  termYears: 15 | 20 | 25 | 30;
  annualRate: number;
  monthlyPaymentUF?: number;
  property: PropertyInfo;
  promesa?: PromesaContract;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  timeline: TimelineEvent[];
}

// ─────────────────────────────────────────────────────────────
// Onboarding ({BRAND.assistantName})
// ─────────────────────────────────────────────────────────────

export type JourneyType =
  | 'primera_vivienda'
  | 'segunda_vivienda'
  | 'subrogacion'
  | 'inversion'
  | 'refinanciamiento';

export type PatrimonialRegime =
  | 'sociedad_conyugal'
  | 'separacion_bienes'
  | 'participacion_gananciales'
  | 'unknown';

export interface CaseSetup {
  journeyType: JourneyType;
  keyFacts: string[];
  dataToFetch: string[];
  dataToAsk: string[];
  nextStep: string;
  isCoTitular: boolean;
  coTitularName?: string;
  patrimonialRegime?: PatrimonialRegime;
  /** Datos estructurados de la propiedad (si {BRAND.assistantName} los capturó) */
  propertyAddress?: string | null;
  propertyCommune?: string | null;
  priceUF?: number | null;
  downPaymentUF?: number | null;
  termYears?: number | null;
}

export interface OnboardingCase extends CaseSetup {
  id: string;
  createdAt: string;
  stage: CaseStage;
  initialMessage: string;
  eugeniaResponse: string;
}

// ─────────────────────────────────────────────────────────────
// Document analysis (Caso 3)
// ─────────────────────────────────────────────────────────────

export type ConsistencyStatus = 'ok' | 'warning' | 'error';

export interface ConsistencyCheck {
  check: string;
  status: ConsistencyStatus;
  explanation: string;
}

export interface DocAnalysis {
  extractedFields: Record<string, string>;
  consistencyChecks: ConsistencyCheck[];
  validityDate: string | null;
  requiresHumanReview: boolean;
  summary: string;
}

// ─────────────────────────────────────────────────────────────
// Comunicaciones (Caso 5)
// ─────────────────────────────────────────────────────────────

export type CommunicationKind = 'email' | 'sms';

export interface Communication {
  id: string;
  caseId: string;
  kind: CommunicationKind;
  date: string;
  from: string;
  subject: string;
  summary: string;
}

// ─────────────────────────────────────────────────────────────
// Audio extraction (Caso 15)
// ─────────────────────────────────────────────────────────────

export interface AudioExtractionBudget {
  amount: number;
  unit: 'UF' | 'CLP';
}

export interface AudioExtraction {
  clientName: string | null;
  clientRut: string | null;
  intent: string;
  budget: AudioExtractionBudget | null;
  propertyInfo: string | null;
  maritalContext: string | null;
  documentsClientHas: string[];
  documentsClientLacks: string[];
  nextStepsImplied: string[];
  clientConcerns: string[];
}

// ─────────────────────────────────────────────────────────────
// Pre-approval (Caso 12 — Portal Inmobiliaria)
// ─────────────────────────────────────────────────────────────

export type PreApprovalDecision = 'pre-approved' | 'conditional' | 'declined';

export interface PreApprovalRequest {
  rut: string;
  propertyValueUF: number;
  downPaymentUF: number;
  termYears: number;
  comment: string;
}

export interface PreApprovalResult {
  decision: PreApprovalDecision;
  maxAmount: number;
  suggestedRate: number;
  monthlyPayment: number;
  conditions: string[];
  validity: number;
  explanation: string;
}

// ─────────────────────────────────────────────────────────────
// Mortgage comparison (Caso 14 — Comparador honesto)
// ─────────────────────────────────────────────────────────────

export interface MortgageOffer {
  id: string;
  bank: string;
  amountUF: number;
  nominalRate: number;
  caeRate: number;
  termYears: number;
  monthlyPaymentCLP: number;
  insurances: string;
  prepaymentCost: string;
  openingFee: string;
  flexibilityNote: string;
}

export type ComparisonWinner = 'banco' | 'competitor1' | 'competitor2' | 'tie';

export interface ComparisonAnalysis {
  offers: MortgageOffer[];
  winners: {
    nominalRate: ComparisonWinner;
    effectiveRate: ComparisonWinner;
    flexibility: ComparisonWinner;
    overall: ComparisonWinner;
  };
  conclusion: string;
}
