import type {
  Case,
  Communication,
  Customer,
  Document,
  Executive,
  TimelineEvent,
} from '@/types';
import { BRAND } from '@/lib/brand';

// ─────────────────────────────────────────────────────────────
// Clientes
// ─────────────────────────────────────────────────────────────

export const customers: Customer[] = [
  {
    id: 'CUS-001',
    fullName: 'Andrés Fuenzalida',
    rut: '16.482.930-7',
    email: 'francisco.perez@gmail.com',
    phone: '+56 9 8745 2310',
    birthDate: '1985-03-14',
    maritalStatus: 'casado_sociedad_conyugal',
    afp: 'Habitat',
    employment: {
      kind: 'dependiente',
      employer: 'Nuestra consultora Consultoría Limitada',
      position: 'Gerente de Proyectos Digitales',
      tenureMonths: 55,
      netMonthlyCLP: 2_450_000,
    },
    address: 'Av. Los Leones 1240, depto 1203',
    commune: 'Providencia',
  },
  {
    id: 'CUS-002',
    fullName: 'María José Contreras Salinas',
    rut: '18.456.123-9',
    email: 'mj.contreras@outlook.com',
    phone: '+56 9 6432 1078',
    birthDate: '1988-08-22',
    maritalStatus: 'casado_sociedad_conyugal',
    afp: 'Cuprum',
    employment: {
      kind: 'independiente',
      position: 'Consultora · Diseño de servicios',
      netMonthlyCLP: 3_400_000,
      variabilityNote:
        'Ingresos varían mes a mes según facturación de proyectos. Promedio últimos 12 meses.',
    },
    address: 'Pedro de Valdivia 1234, depto 802',
    commune: 'Providencia',
  },
  {
    id: 'CUS-003',
    fullName: 'Sebastián Rojas Muñoz',
    rut: '13.567.890-2',
    email: 'sebastian.rojas@codelco.cl',
    phone: '+56 9 7821 4495',
    birthDate: '1979-11-02',
    maritalStatus: 'casado_separacion_bienes',
    afp: 'Provida',
    employment: {
      kind: 'dependiente',
      employer: 'Codelco · División El Teniente',
      position: 'Subgerente de Operaciones',
      tenureMonths: 132,
      netMonthlyCLP: 4_200_000,
    },
    address: 'Av. Vitacura 3500, depto 1402',
    commune: 'Vitacura',
  },
  {
    id: 'CUS-004',
    fullName: 'Catalina Soto Henríquez',
    rut: '20.123.456-5',
    email: 'catalina.soto@empresanacional.cl',
    phone: '+56 9 5512 8867',
    birthDate: '1995-06-17',
    maritalStatus: 'soltero',
    afp: 'Capital',
    employment: {
      kind: 'dependiente',
      employer: 'Competidor E',
      position: 'Analista comercial senior',
      tenureMonths: 38,
      netMonthlyCLP: 1_950_000,
    },
    address: 'Manuel Montt 1820, depto 303',
    commune: 'Providencia',
  },
  {
    id: 'CUS-005',
    fullName: 'Diego Henríquez Castro',
    rut: '16.789.012-1',
    email: 'diego.henriquez@latam.com',
    phone: '+56 9 9145 7702',
    birthDate: '1983-01-29',
    maritalStatus: 'conviviente_civil',
    afp: 'Habitat',
    employment: {
      kind: 'dependiente',
      employer: 'LATAM Cargo',
      position: 'Jefe de Logística',
      tenureMonths: 71,
      netMonthlyCLP: 2_300_000,
    },
    address: 'Av. Providencia 7800, depto 1407',
    commune: 'Providencia',
  },
];

// ─────────────────────────────────────────────────────────────
// Ejecutivos
// ─────────────────────────────────────────────────────────────

export const executives: Executive[] = [
  {
    id: 'EXE-001',
    fullName: 'Camila Reinoso Pereira',
    rut: '14.567.890-1',
    email: 'ymarichal@propio.cl',
    branch: 'Sucursal Vitacura',
  },
  {
    id: 'EXE-002',
    fullName: 'Felipe Andrade Riquelme',
    rut: '15.890.123-K',
    email: 'fandrade@propio.cl',
    branch: 'Sucursal Providencia',
  },
];

// ─────────────────────────────────────────────────────────────
// Caso principal — Andrés Fuenzalida
// ─────────────────────────────────────────────────────────────

const FRANCISCO_DOCS: Document[] = [
  {
    id: 'DOC-0042-01',
    caseId: 'HIP-2026-0042',
    kind: 'cedula',
    label: 'Cédula de identidad por ambos lados',
    status: 'validado',
    uploadedAt: '2026-04-18T09:21:00-04:00',
    validatedAt: '2026-04-18T09:22:00-04:00',
    uploadedBy: 'cliente',
    extractedData: {
      rut: '16.482.930-7',
      vencimiento: '2031-03-14',
      matchBiometrico: 0.97,
    },
  },
  {
    id: 'DOC-0042-02',
    caseId: 'HIP-2026-0042',
    kind: 'liquidacion',
    label: '3 últimas liquidaciones de sueldo (renta fija)',
    status: 'validado',
    uploadedAt: '2026-04-19T11:15:00-04:00',
    validatedAt: '2026-04-19T11:45:00-04:00',
    uploadedBy: 'cliente',
    extractedData: {
      empleador: 'Nuestra consultora Consultoría Limitada',
      ingresoLiquidoPromedio: 2_450_000,
      mesesAnalizados: 3,
    },
  },
  {
    id: 'DOC-0042-03',
    caseId: 'HIP-2026-0042',
    kind: 'previred',
    label: 'Certificado de 12 últimas cotizaciones de AFP',
    status: 'validado',
    uploadedAt: '2026-05-03T15:20:00-04:00',
    validatedAt: '2026-05-03T15:38:00-04:00',
    uploadedBy: 'cliente',
    extractedData: {
      cotizacionesContinuas: true,
      empleador: 'Nuestra consultora Consultoría Limitada',
      mesesCotizados: 12,
      promedioCotizadoCLP: 2_080_000,
      desviacionEstandar: 0.06,
    },
  },
  {
    id: 'DOC-0042-04',
    caseId: 'HIP-2026-0042',
    kind: 'preaprobacion',
    label: `Pre-aprobación interna ${BRAND.shortName}`,
    status: 'validado',
    uploadedAt: '2026-03-30T11:42:00-03:00',
    validatedAt: '2026-03-30T11:42:00-03:00',
    uploadedBy: 'sistema',
    extractedData: {
      montoMaximoUF: 7_000,
      perfilRiesgo: 'A',
      scoreInterno: 742,
    },
  },
  {
    id: 'DOC-0042-05',
    caseId: 'HIP-2026-0042',
    kind: 'certificado_matrimonio',
    label: 'Certificado de matrimonio · Registro Civil',
    status: 'pendiente',
    notes: 'Solicitado por la ejecutiva el 12 may. Necesario para co-titularidad de María José.',
  },
  {
    id: 'DOC-0042-06',
    caseId: 'HIP-2026-0042',
    kind: 'tasacion',
    label: 'Tasación independiente · Av. Vitacura 2950',
    status: 'pendiente',
    notes: 'Tasador asignado: Gestión Inmobiliaria SpA. Visita agendada 22 may.',
  },
];

const FRANCISCO_TIMELINE: TimelineEvent[] = [
  {
    id: 'EV-0042-01',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-03-28T10:14:00-03:00',
    actor: { kind: 'cliente', name: 'Andrés Fuenzalida', id: 'CUS-001' },
    type: 'solicitud_creada',
    title: 'Consulta inicial en Sucursal Vitacura',
    detail: 'Francisco se acerca a la sucursal para evaluar opciones de financiamiento hipotecario.',
    state: 'done',
  },
  {
    id: 'EV-0042-02',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-03-30T11:42:00-03:00',
    actor: { kind: 'sistema' },
    type: 'preaprobacion',
    title: 'Pre-aprobación automática emitida',
    detail: 'Monto máximo UF 7.000, perfil de riesgo A, score interno 742. Vigencia 90 días.',
    state: 'done',
    metadata: { montoMaximoUF: 7_000, perfil: 'A', score: 742 },
  },
  {
    id: 'EV-0042-03',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-15T14:30:00-04:00',
    actor: { kind: 'cliente', name: 'Andrés Fuenzalida', id: 'CUS-001' },
    type: 'firma_contrato',
    title: 'Promesa de compraventa firmada con Inmobiliaria Los Almendros',
    detail: 'Promesa por UF 340 (5% del precio). Notaría Sergio Cortés, Providencia.',
    state: 'done',
    metadata: { montoPromesaUF: 340, notaria: 'Sergio Cortés' },
  },
  {
    id: 'EV-0042-04',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-18T09:20:00-04:00',
    actor: { kind: 'cliente', name: 'Andrés Fuenzalida', id: 'CUS-001' },
    type: 'solicitud_creada',
    title: 'Solicitud hipotecaria formal creada desde portal',
    detail: 'Monto solicitado UF 4.760, plazo 25 años, propiedad Av. Vitacura 2950.',
    state: 'done',
  },
  {
    id: 'EV-0042-05',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-18T09:22:00-04:00',
    actor: { kind: 'agente' },
    type: 'identidad_verificada',
    title: 'Verificación de identidad completada',
    detail: 'OCR de cédula + match biométrico contra Registro Civil. Confianza 97%.',
    state: 'done',
    metadata: { confianzaMatch: 0.97 },
  },
  {
    id: 'EV-0042-06',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-19T11:15:00-04:00',
    actor: { kind: 'cliente', name: 'Andrés Fuenzalida', id: 'CUS-001' },
    type: 'documento_subido',
    title: 'Subió liquidaciones de sueldo (febrero, marzo, abril 2026)',
    state: 'done',
  },
  {
    id: 'EV-0042-07',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-19T11:45:00-04:00',
    actor: { kind: 'agente' },
    type: 'ingreso_validado',
    title: 'Liquidaciones procesadas y validadas',
    detail: 'Ingreso líquido reconocido: $2.450.000 promedio sobre 3 meses. Sin variabilidad intra-mes en liquidaciones.',
    state: 'done',
    metadata: { ingresoLiquidoCLP: 2_450_000, mesesAnalizados: 3, fuente: 'liquidaciones' },
  },
  {
    id: 'EV-0042-08',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-20T16:30:00-04:00',
    actor: { kind: 'agente' },
    type: 'cruce_bureau',
    title: 'Cruce con CMF y bureau interno',
    detail: 'Deudas vigentes $340.000/mes (TC + crédito de consumo). DTI proyectado 13.9% sobre renta declarada.',
    state: 'done',
    metadata: { deudasMensualesCLP: 340_000, dtiProyectado: 0.139 },
  },
  {
    id: 'EV-0042-09',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-04-22T10:00:00-04:00',
    actor: { kind: 'ejecutivo', name: 'Camila Reinoso Pereira', id: 'EXE-001' },
    type: 'asignacion_caso',
    title: 'Caso asignado a Camila Reinoso (Sucursal Vitacura)',
    detail: 'Llamada inicial agendada con cliente para el 23 abr.',
    state: 'done',
  },
  {
    id: 'EV-0042-10',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-05-03T15:20:00-04:00',
    actor: { kind: 'cliente', name: 'Andrés Fuenzalida', id: 'CUS-001' },
    type: 'documento_subido',
    title: 'Subió cartola Previred (últimos 12 meses)',
    state: 'done',
  },
  {
    id: 'EV-0042-11',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-05-12T10:30:00-04:00',
    actor: { kind: 'ejecutivo', name: 'Camila Reinoso Pereira', id: 'EXE-001' },
    type: 'solicitud_documento',
    title: 'Camila solicita certificado de matrimonio y tasación',
    detail:
      'El certificado es necesario para sumar a María José como co-titular. Tasación independiente agendada con Gestión Inmobiliaria SpA.',
    state: 'done',
  },
  {
    id: 'EV-0042-12',
    caseId: 'HIP-2026-0042',
    timestamp: '2026-05-18T16:45:00-04:00',
    actor: { kind: 'agente' },
    type: 'observacion_ia',
    title: 'Variabilidad detectada en ingresos de la co-titular',
    detail:
      'Los honorarios mensuales de María José Contreras muestran desviación estándar de 38% sobre el promedio declarado. Se recomienda extender análisis a 24 meses para promedio más estable.',
    state: 'current',
    metadata: {
      ingresoDeclaradoCLP: 3_400_000,
      desviacionEstandar: 0.38,
      mesesAnalizados: 12,
      recomendacion: 'extender_a_24_meses',
    },
  },
];

const FRANCISCO_CASE: Case = {
  id: 'HIP-2026-0042',
  customerId: 'CUS-001',
  coTitularId: 'CUS-002',
  executiveId: 'EXE-001',
  stage: 'recopilacion',
  requestedUF: 4_760,
  downPaymentUF: 2_040,
  termYears: 25,
  annualRate: 4.65,
  monthlyPaymentUF: 26.8,
  property: {
    address: 'Av. Vitacura 2950',
    commune: 'Vitacura',
    type: 'casa',
    valueUF: 6_800,
    bedrooms: 3,
    bathrooms: 2,
    surfaceM2: 220,
    developer: 'Inmobiliaria Los Almendros',
    realEstate: 'Los Almendros Propiedades',
  },
  promesa: {
    signedAt: '2026-04-15T14:30:00-04:00',
    amountUF: 340,
    notary: 'Notaría Sergio Cortés',
    reference: 'Repertorio 2026-04788',
  },
  createdAt: '2026-04-18T09:20:00-04:00',
  updatedAt: '2026-05-18T16:45:00-04:00',
  documents: FRANCISCO_DOCS,
  timeline: FRANCISCO_TIMELINE,
};

// ─────────────────────────────────────────────────────────────
// Otros 4 casos en bandeja de Camila
// ─────────────────────────────────────────────────────────────

const OTHER_CASES: Case[] = [
  {
    id: 'HIP-2026-0058',
    customerId: 'CUS-002',
    executiveId: 'EXE-001',
    stage: 'solicitud',
    requestedUF: 4_200,
    downPaymentUF: 1_800,
    termYears: 20,
    annualRate: 4.85,
    property: {
      address: 'Pedro de Valdivia 1234, depto 802',
      commune: 'Providencia',
      type: 'departamento',
      valueUF: 6_000,
      developer: 'Fundamenta',
    },
    createdAt: '2026-05-15T11:20:00-04:00',
    updatedAt: '2026-05-18T09:10:00-04:00',
    documents: [],
    timeline: [],
  },
  {
    id: 'HIP-2026-0061',
    customerId: 'CUS-003',
    executiveId: 'EXE-001',
    stage: 'escrituracion',
    requestedUF: 11_500,
    downPaymentUF: 2_500,
    termYears: 20,
    annualRate: 4.42,
    property: {
      address: 'Av. Vitacura 3500, depto 1402',
      commune: 'Vitacura',
      type: 'departamento',
      valueUF: 14_000,
      developer: 'Manquehue',
    },
    createdAt: '2026-03-15T11:00:00-03:00',
    updatedAt: '2026-05-17T17:45:00-04:00',
    documents: [],
    timeline: [],
  },
  {
    id: 'HIP-2026-0073',
    customerId: 'CUS-004',
    executiveId: 'EXE-001',
    stage: 'recopilacion',
    requestedUF: 3_300,
    downPaymentUF: 500,
    termYears: 30,
    annualRate: 5.15,
    property: {
      address: 'Manuel Montt 1820, depto 303',
      commune: 'Providencia',
      type: 'departamento',
      valueUF: 3_800,
      developer: 'Inmobiliaria Almagro',
    },
    createdAt: '2026-04-28T14:10:00-04:00',
    updatedAt: '2026-05-16T11:22:00-04:00',
    documents: [],
    timeline: [],
  },
  {
    id: 'HIP-2026-0080',
    customerId: 'CUS-005',
    executiveId: 'EXE-001',
    stage: 'tasacion',
    requestedUF: 4_200,
    downPaymentUF: 1_300,
    termYears: 25,
    annualRate: 4.78,
    property: {
      address: 'Av. Providencia 7800, depto 1407',
      commune: 'Providencia',
      type: 'departamento',
      valueUF: 5_500,
      developer: 'Los Almendros',
    },
    createdAt: '2026-05-02T10:30:00-04:00',
    updatedAt: '2026-05-19T08:45:00-04:00',
    documents: [],
    timeline: [],
  },
];

export const cases: Case[] = [FRANCISCO_CASE, ...OTHER_CASES];

// ─────────────────────────────────────────────────────────────
// Comunicaciones (email + SMS) del caso principal
// ─────────────────────────────────────────────────────────────

export const communications: Communication[] = [
  {
    id: 'CMM-001',
    caseId: 'HIP-2026-0042',
    kind: 'sms',
    date: '2026-03-30T11:43:00-03:00',
    from: BRAND.shortName,
    subject: 'Pre-aprobación lista',
    summary: 'Tu pre-aprobación está lista por hasta UF 7.000. Vigencia 90 días.',
  },
  {
    id: 'CMM-002',
    caseId: 'HIP-2026-0042',
    kind: 'email',
    date: '2026-04-18T09:25:00-04:00',
    from: `${BRAND.shortName} · Sistema Tus nuevas Llaves`,
    subject: 'Recibimos tu solicitud hipotecaria',
    summary:
      'Caso #HIP-2026-0042 creado correctamente. Verificación de identidad completada. Te contactaremos en 24-48 horas hábiles.',
  },
  {
    id: 'CMM-003',
    caseId: 'HIP-2026-0042',
    kind: 'sms',
    date: '2026-04-22T10:02:00-04:00',
    from: BRAND.shortName,
    subject: 'Ejecutiva asignada',
    summary: 'Camila Reinoso te contactará en las próximas 24h.',
  },
  {
    id: 'CMM-004',
    caseId: 'HIP-2026-0042',
    kind: 'email',
    date: '2026-05-12T10:32:00-04:00',
    from: `Camila Reinoso · ${BRAND.shortName}`,
    subject: 'Documentos pendientes para avanzar',
    summary:
      'Necesitamos el certificado de matrimonio y la tasación independiente para incorporar a María José como co-titular y completar la etapa de documentos.',
  },
  {
    id: 'CMM-005',
    caseId: 'HIP-2026-0042',
    kind: 'email',
    date: '2026-05-18T16:48:00-04:00',
    from: 'Tus nuevas Llaves · Sistema',
    subject: 'Observación sobre ingresos de tu co-titular',
    summary:
      'Detectamos variabilidad en los ingresos declarados por María José. Camila te contactará para conversar opciones.',
  },
];

export function communicationsByCase(caseId: string): Communication[] {
  return communications.filter((c) => c.caseId === caseId);
}

// ─────────────────────────────────────────────────────────────
// Selectores convenientes
// ─────────────────────────────────────────────────────────────

export const currentCustomer = customers[0];
export const currentCase = cases[0];
export const currentExecutive = executives[0];

export function getCustomer(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getCase(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}

export function getExecutive(id: string): Executive | undefined {
  return executives.find((e) => e.id === id);
}

export function casesByExecutive(executiveId: string): Case[] {
  return cases.filter((c) => c.executiveId === executiveId);
}
