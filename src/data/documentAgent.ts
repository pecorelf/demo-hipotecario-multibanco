import { BRAND } from '@/lib/brand';

// ============================================================
// MOCK DOCUMENT AI AGENT — simulación local
// Para la demo: respuestas pre-armadas sin llamar a la API.
// ============================================================

export type DocStatus = 'pending' | 'uploading' | 'analyzing' | 'approved' | 'rejected' | 'review';

export type DocOwner = 'cliente' | 'vendedor' | 'inmobiliaria' | 'banco';

export type JourneyStage = 'evaluacion' | 'cotizacion' | 'antecedentes' | 'cotizacion-final' | 'borrador' | 'notaria' | 'activacion';

export type DocumentItem = {
  id: string;
  name: string;
  description: string;
  owner: DocOwner;
  status: DocStatus;
  stage: JourneyStage;
  critical: boolean;          // ¿bloquea el avance?
  // Campos cuando está procesado:
  fileName?: string;
  uploadedAt?: string;
  extractedFields?: { label: string; value: string }[];
  // Cuando está rejected:
  repair?: {
    title: string;            // motivo técnico breve
    explanation: string;      // idioma corriente
    instruction: string;      // qué tiene que hacer el cliente
  };
};

// ============================================================
// ESCENARIO DEMO — María González, primera vivienda usada
// ============================================================

export const initialDocuments: DocumentItem[] = [
  // Etapa 3 — Antecedentes del cliente
  {
    id: 'doc-001',
    name: 'Cédula de identidad',
    description: 'Cédula vigente, foto del documento por ambos lados.',
    owner: 'cliente',
    status: 'approved',
    stage: 'antecedentes',
    critical: true,
    fileName: 'cedula_maria_gonzalez.jpg',
    uploadedAt: '2026-06-01 09:42',
    extractedFields: [
      { label: 'Nombre', value: 'María Soledad González Pérez' },
      { label: 'RUT', value: '17.482.661-K' },
      { label: 'Fecha de nacimiento', value: '14 marzo 1989' },
      { label: 'Vencimiento', value: '14 marzo 2032' },
    ],
  },
  {
    id: 'doc-002',
    name: 'Últimas 3 liquidaciones de sueldo',
    description: 'Liquidaciones de los últimos 3 meses, todas las páginas.',
    owner: 'cliente',
    status: 'rejected',
    stage: 'antecedentes',
    critical: true,
    fileName: 'liquidaciones_abril_mayo.pdf',
    uploadedAt: '2026-06-01 09:48',
    repair: {
      title: 'Liquidación incompleta',
      explanation: 'Subiste las liquidaciones de abril y mayo, pero falta la de marzo. Además, la liquidación de abril está cortada en la última página — no se ve el sueldo líquido ni la firma del empleador.',
      instruction: 'Sube las 3 liquidaciones completas (marzo, abril, mayo), asegurándote que cada una tenga todas sus páginas. Si tu empleador te las manda por correo, pídeles que las exporten en PDF y no como foto.',
    },
  },
  {
    id: 'doc-003',
    name: 'Certificado de cotizaciones AFP',
    description: 'Últimos 12 meses, descargable desde el sitio de tu AFP.',
    owner: 'cliente',
    status: 'review',
    stage: 'antecedentes',
    critical: true,
  },
  {
    id: 'doc-004',
    name: 'Certificado SII de renta',
    description: 'Formulario 22 del año anterior. Descargable desde www.sii.cl',
    owner: 'cliente',
    status: 'pending',
    stage: 'antecedentes',
    critical: true,
  },
  {
    id: 'doc-005',
    name: 'Certificado tributario complementario',
    description: 'Solo si tienes ingresos extra a la renta principal.',
    owner: 'cliente',
    status: 'pending',
    stage: 'antecedentes',
    critical: false,
  },

  // Vendedor — propiedad usada
  {
    id: 'doc-101',
    name: 'Escritura de la propiedad',
    description: 'Escritura pública del vendedor, vigente.',
    owner: 'vendedor',
    status: 'approved',
    stage: 'antecedentes',
    critical: true,
    fileName: 'escritura_propiedad.pdf',
    uploadedAt: '2026-06-02 16:22',
    extractedFields: [
      { label: 'Dueño', value: 'Pedro Mendoza Cifuentes' },
      { label: 'Dirección', value: 'Av. Los Leones 4501, Providencia' },
      { label: 'Rol', value: '4521-89' },
      { label: 'Fecha escritura', value: '12 noviembre 2018' },
    ],
  },
  {
    id: 'doc-102',
    name: 'Certificado de dominio vigente',
    description: 'Emitido por el Conservador de Bienes Raíces.',
    owner: 'vendedor',
    status: 'pending',
    stage: 'antecedentes',
    critical: true,
  },
  {
    id: 'doc-103',
    name: 'Certificado de gravámenes',
    description: 'CBR. Vigencia máxima 30 días.',
    owner: 'vendedor',
    status: 'pending',
    stage: 'antecedentes',
    critical: true,
  },
  {
    id: 'doc-104',
    name: 'Certificado de contribuciones al día',
    description: 'Tesorería General o municipalidad correspondiente.',
    owner: 'vendedor',
    status: 'pending',
    stage: 'antecedentes',
    critical: true,
  },
  {
    id: 'doc-105',
    name: 'Pago de gastos comunes al día',
    description: 'Certificado del administrador de la copropiedad.',
    owner: 'vendedor',
    status: 'pending',
    stage: 'antecedentes',
    critical: false,
  },
];

// ============================================================
// MOCK ANALYSIS — respuestas pre-armadas según nombre de archivo
// El "agente IA" simula 3-5 segundos de análisis y devuelve resultado
// ============================================================

export type AnalysisResult = {
  status: 'approved' | 'rejected';
  extractedFields?: { label: string; value: string }[];
  repair?: {
    title: string;
    explanation: string;
    instruction: string;
  };
};

// Decisión: el resultado depende del nombre del archivo
// Si contiene "ok", "ok2", "completo" → aprobado
// Si no, → reparo con explicación específica al doc
export function mockAnalyze(docId: string, fileName: string): AnalysisResult {
  const goodKeywords = ['ok', 'completo', 'final', 'v2', 'corregido'];
  const isGood = goodKeywords.some(k => fileName.toLowerCase().includes(k));

  // Respuestas pre-armadas por tipo de documento
  const responses: Record<string, { good: AnalysisResult; bad: AnalysisResult }> = {
    'doc-001': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'Nombre', value: 'María Soledad González Pérez' },
          { label: 'RUT', value: '17.482.661-K' },
          { label: 'Fecha de nacimiento', value: '14 marzo 1989' },
          { label: 'Vencimiento', value: '14 marzo 2032' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Cédula vencida',
          explanation: 'La cédula que subiste venció en febrero de este año. Necesitamos una vigente para continuar con el proceso.',
          instruction: 'Renueva tu cédula en cualquier oficina del Registro Civil y sube la nueva versión. Mientras tanto, puedes seguir trabajando en los otros documentos.',
        },
      },
    },
    'doc-002': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'Empleador', value: 'Cencosud Retail S.A.' },
          { label: 'Cargo', value: 'Analista Senior' },
          { label: 'Renta líquida promedio', value: '$ 2.450.000' },
          { label: 'Antigüedad', value: '4 años, 2 meses' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Liquidación incompleta',
          explanation: 'Subiste las liquidaciones de abril y mayo, pero falta la de marzo. Además, la liquidación de abril está cortada en la última página — no se ve el sueldo líquido ni la firma del empleador.',
          instruction: 'Sube las 3 liquidaciones completas (marzo, abril, mayo), asegurándote que cada una tenga todas sus páginas. Si tu empleador te las manda por correo, pídeles que las exporten en PDF y no como foto.',
        },
      },
    },
    'doc-003': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'AFP', value: 'Provida' },
          { label: 'Cotizaciones últimos 12 meses', value: '12 de 12' },
          { label: 'Última cotización', value: 'Mayo 2026' },
          { label: 'Estado', value: 'Al día' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Período insuficiente',
          explanation: 'El certificado que subiste muestra solo los últimos 6 meses. Necesitamos los últimos 12 para validar tu continuidad laboral.',
          instruction: 'Vuelve a entrar a la web de tu AFP y descarga el certificado con período de 12 meses. Busca la opción "Certificado de cotizaciones" y elige "Últimos 12 meses".',
        },
      },
    },
    'doc-004': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'Año tributario', value: '2025' },
          { label: 'Renta total', value: '$ 32.480.000' },
          { label: 'Estado declaración', value: 'Aceptada' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Año tributario incorrecto',
          explanation: 'Subiste el formulario 22 del año 2024, pero necesitamos el del año tributario 2025 (que reporta la renta del 2024).',
          instruction: 'Entra a www.sii.cl con tu RUT y clave, anda a "Mi SII" → "Renta" → "Certificado de Renta", y descarga el del año tributario 2025.',
        },
      },
    },
    'doc-102': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'Inscripción', value: 'Fojas 4521 Nº 89' },
          { label: 'Año', value: '2018' },
          { label: 'CBR', value: 'Conservador de Santiago' },
          { label: 'Vigencia', value: '28 días restantes' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Certificado vencido',
          explanation: 'El certificado de dominio vigente fue emitido hace 45 días. La normativa exige máximo 30 días de antigüedad.',
          instruction: 'Pedí un nuevo certificado al Conservador de Bienes Raíces. Lo puedes solicitar online en www.conservador.cl con el rol de la propiedad.',
        },
      },
    },
    'doc-103': {
      good: {
        status: 'approved',
        extractedFields: [
          { label: 'Estado', value: 'Sin gravámenes ni prohibiciones' },
          { label: 'Fecha emisión', value: 'Hoy' },
          { label: 'Vigencia', value: '30 días' },
        ],
      },
      bad: {
        status: 'rejected',
        repair: {
          title: 'Gravamen detectado',
          explanation: 'El certificado muestra una hipoteca activa con otro banco (BCI) por UF 1.200. Esta hipoteca debe ser alzada antes de continuar.',
          instruction: 'Contactá al vendedor para coordinar el alzamiento de la hipoteca previa. Esto suele coordinarse con el banco que liberará los fondos. Tu ejecutivo Camila puede ayudarte a coordinarlo.',
        },
      },
    },
  };

  // Fallback genérico si el doc no está en el mapa
  const fallback = {
    good: {
      status: 'approved' as const,
      extractedFields: [
        { label: 'Documento verificado', value: 'Datos extraídos correctamente' },
        { label: 'Validación', value: 'Aprobada' },
      ],
    },
    bad: {
      status: 'rejected' as const,
      repair: {
        title: 'Documento ilegible',
        explanation: 'El archivo que subiste tiene calidad muy baja o está rotado. No pudimos leer la información completa.',
        instruction: 'Sube una nueva versión escaneada en buena resolución (mínimo 200 dpi) o una foto bien iluminada y derecha.',
      },
    },
  };

  const r = responses[docId] || fallback;
  return isGood ? r.good : r.bad;
}

// ============================================================
// JOURNEY STAGES — definición canónica de las 7 etapas {BRAND.shortName}
// ============================================================

export const journeyStages: { id: JourneyStage; num: number; title: string; subtitle: string; }[] = [
  { id: 'evaluacion', num: 1, title: 'Evaluación', subtitle: 'Sitio público o privado' },
  { id: 'cotizacion', num: 2, title: 'Aceptación de cotización', subtitle: 'Ley SERNAC' },
  { id: 'antecedentes', num: 3, title: 'Recopilación de antecedentes', subtitle: 'Carpeta comercial y legal' },
  { id: 'cotizacion-final', num: 4, title: 'Cotización final', subtitle: 'Normativa CMF marzo 2026' },
  { id: 'borrador', num: 5, title: 'Borrador escritura', subtitle: 'Confección y visado' },
  { id: 'notaria', num: 6, title: 'Firma en notaría', subtitle: 'Registro en CBR' },
  { id: 'activacion', num: 7, title: 'Activación', subtitle: 'Desembolso de fondos' },
];

// Etapa actual del cliente demo
export const CURRENT_STAGE: JourneyStage = 'antecedentes';
