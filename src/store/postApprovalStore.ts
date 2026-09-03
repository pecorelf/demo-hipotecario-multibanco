import { BRAND } from '@/lib/brand';
import { create } from 'zustand';

/**
 * Post-approval operation store.
 *
 * Modela el estado del proceso hipotecario UNA VEZ que la hipoteca
 * está aprobada y el cliente entra al portal. El POC, a partir de
 * aquí, gira en torno a este store.
 *
 * Conceptos clave:
 *
 *  - PropertyType: Nueva (inmobiliaria) o Usada (vendedor particular).
 *    Cambia el listado de documentos del track Estudio de Títulos.
 *
 *  - Tracks paralelos:
 *    · Estudio de Títulos: documentos legales de la propiedad
 *      Provistos por el vendedor (usada) o inmobiliaria (nueva).
 *    · Carpeta Comercial: documentos del comprador para evaluación
 *      crediticia. Provistos por el comprador (y eventualmente el
 *      empleador).
 *
 *  - Actores: comprador, vendedor, inmobiliaria, ejecutivo.
 *
 *  - Gate de pago: para avanzar el Estudio de Títulos hay que pagar
 *    primero los gastos operacionales.
 *
 *  - Reparos: cualquier documento puede recibir un reparo del banco;
 *    eso dispara notificación al actor responsable.
 */

export type PropertyType = 'usada' | 'nueva';
export type Actor = 'comprador' | 'vendedor' | 'inmobiliaria' | 'ejecutivo';
export type TrackKey = 'titulos' | 'tasacion' | 'comercial';

export type DocStatus =
  | 'pendiente'      // todavía no subido
  | 'en_validacion'  // subido, en revisión IA + ejecutivo
  | 'validado'       // ✓ aceptado
  | 'con_reparo';    // ✗ tiene un reparo, vuelta al actor

/** Resultado IA scripted cuando un actor sube un documento. */
export type ScriptedOutcome =
  | { kind: 'validado'; extractedFields: Record<string, string> }
  | { kind: 'con_observacion'; reason: string; extractedFields?: Record<string, string> }
  | { kind: 'no_coincide'; expected: string; detected: string };

/** Registro auditable de uploads. */
export interface UploadEntry {
  uploadedBy: Actor;
  uploadedByName: string;
  uploadedAt: string;
  note?: string;
}

export interface OperationDoc {
  id: string;
  name: string;
  description: string;       // 1 línea explicativa
  responsible: Actor;        // quién debe gestionarlo (responsable formal)
  track: TrackKey;
  status: DocStatus;
  uploadedAt?: string;
  uploadedBy?: Actor;
  uploadedByName?: string;
  uploadHistory?: UploadEntry[];
  validatedAt?: string;
  repairReason?: string;
  optional?: boolean;
  scriptedOutcome?: ScriptedOutcome;
}

export interface OperationNotification {
  id: string;
  type: 'reparo' | 'pago_pendiente' | 'avance' | 'documento_subido' | 'reparo_resuelto';
  targetActor: Actor;
  title: string;
  body: string;
  link?: string;              // ruta interna a la que dirige la acción
  createdAt: string;
  read: boolean;
  relatedDocId?: string;
}

interface PostApprovalState {
  // ── Tipo de propiedad ────────────────────────────────────────
  propertyType: PropertyType;

  // ── Operación ───────────────────────────────────────────────
  caseRef: string;             // "HIP-2026-0042"
  approvedAt: string;          // fecha aprobación crédito
  propertyAddress: string;
  propertyValueUF: number;
  loanAmountUF: number;
  buyerName: string;
  sellerName: string;          // si usada
  inmobiliariaName: string;    // si nueva
  ejecutivoName: string;
  syncFromBrand: () => void;

  // ── Pago de gastos operacionales ────────────────────────────
  gastosOperacionalesUF: number;
  gastosOperacionalesPaid: boolean;
  gastosOperacionalesPaidAt?: string;

  // ── Documentos ──────────────────────────────────────────────
  docs: OperationDoc[];

  // ── Notificaciones ──────────────────────────────────────────
  notifications: OperationNotification[];

  // ── Acciones ────────────────────────────────────────────────
  setPropertyType: (t: PropertyType) => void;
  uploadDoc: (docId: string, uploadedBy?: Actor) => void;
  validateDoc: (docId: string) => void;
  raiseRepair: (docId: string, reason: string, raisedBy?: Actor) => void;
  resolveRepair: (docId: string, uploadedBy?: Actor) => void;
  payGastos: () => void;
  markNotificationRead: (id: string) => void;
  markAllRead: (actor?: Actor) => void;
  resetOperation: () => void;
}

// ─── Documentos por tipo de propiedad ──────────────────────────

const DOCS_TITULOS_USADA: OperationDoc[] = [
  {
    id: 't-1',
    name: 'Certificado de dominio vigente',
    description: 'Acredita que el vendedor es el dueño actual de la propiedad. Emitido por el CBR.',
    responsible: 'vendedor',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-2',
    name: 'Certificado de hipotecas y gravámenes',
    description: 'Indica si la propiedad tiene hipotecas, embargos o prohibiciones.',
    responsible: 'vendedor',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-3',
    name: 'Certificado de no expropiación',
    description: 'Confirma que la propiedad no está afecta a procesos de expropiación municipal o estatal.',
    responsible: 'vendedor',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-4',
    name: 'Reglamento de copropiedad',
    description: 'Aplica si es departamento. Define normas internas del edificio.',
    responsible: 'vendedor',
    track: 'titulos',
    status: 'pendiente',
    optional: true,
  },
  {
    id: 't-5',
    name: 'Inscripción del título en el CBR',
    description: 'Inscripción vigente en el Conservador de Bienes Raíces.',
    responsible: 'vendedor',
    track: 'titulos',
    status: 'pendiente',
  },
];

const DOCS_TITULOS_NUEVA: OperationDoc[] = [
  {
    id: 't-n-1',
    name: 'Permiso de edificación',
    description: 'Autorización municipal para construir el proyecto, emitida por la DOM.',
    responsible: 'inmobiliaria',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-n-2',
    name: 'Recepción definitiva',
    description: 'Certificado que acredita que la obra está terminada y aprobada por la DOM.',
    responsible: 'inmobiliaria',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-n-3',
    name: 'Certificado de inscripción del primer dueño',
    description: 'Inscripción en el CBR a nombre de la inmobiliaria como primer titular.',
    responsible: 'inmobiliaria',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-n-4',
    name: 'Boletín informativo del proyecto',
    description: 'Documento con la descripción comercial y técnica del proyecto inmobiliario.',
    responsible: 'inmobiliaria',
    track: 'titulos',
    status: 'pendiente',
  },
  {
    id: 't-n-5',
    name: 'Plano de la unidad',
    description: 'Plano firmado por arquitecto con metraje, distribución y deslindes de tu unidad.',
    responsible: 'inmobiliaria',
    track: 'titulos',
    status: 'pendiente',
  },
];

const DOCS_COMERCIAL: OperationDoc[] = [
  {
    id: 'c-1',
    name: 'Últimas 3 liquidaciones de sueldo',
    description: 'Liquidaciones de los últimos 3 meses, firmadas por tu empleador.',
    responsible: 'comprador',
    track: 'comercial',
    status: 'pendiente',
  },
  {
    id: 'c-2',
    name: 'Certificado de cotizaciones AFP',
    description: 'Últimos 12 meses de cotizaciones previsionales. Descargable desde tu AFP.',
    responsible: 'comprador',
    track: 'comercial',
    status: 'pendiente',
  },
  {
    id: 'c-3',
    name: 'Carpeta tributaria para créditos',
    description: 'Generada en sii.cl, modalidad créditos hipotecarios. Tiene vigencia 60 días.',
    responsible: 'comprador',
    track: 'comercial',
    status: 'pendiente',
  },
  {
    id: 'c-4',
    name: 'Certificado de antecedentes comerciales',
    description: 'DICOM o Equifax. Vigente, no mayor a 30 días.',
    responsible: 'comprador',
    track: 'comercial',
    status: 'pendiente',
  },
  {
    id: 'c-5',
    name: 'Certificado de matrimonio o conviviente civil',
    description: 'Solo si aplica. Vigente, no mayor a 90 días.',
    responsible: 'comprador',
    track: 'comercial',
    status: 'pendiente',
    optional: true,
  },
];

// Tasación — paralelo a Estudio de Títulos, comparten gate de pago
const DOCS_TASACION: OperationDoc[] = [
  {
    id: 'ts-1',
    name: 'Solicitud de tasación',
    description: 'El banco genera la solicitud y la envía al perito tasador asignado. Automático.',
    responsible: 'ejecutivo',
    track: 'tasacion',
    status: 'pendiente',
  },
  {
    id: 'ts-2',
    name: 'Informe de tasación',
    description: 'Informe técnico del perito con valor comercial de la propiedad. Sustenta el monto del crédito.',
    responsible: 'ejecutivo',
    track: 'tasacion',
    status: 'pendiente',
  },
  {
    id: 'ts-3',
    name: 'Aprobación del valor tasado',
    description: 'Validación interna del banco del valor entregado por el perito. Habilita avance.',
    responsible: 'ejecutivo',
    track: 'tasacion',
    status: 'pendiente',
  },
];

/** Outcomes scripted por doc para la simulación IA al subir. */
export const SCRIPTED_OUTCOMES: Record<string, ScriptedOutcome> = {
  't-1': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Certificado de Dominio Vigente',
      'CBR': 'Santiago',
      'Emitido': '15 de mayo de 2026',
      'Vigencia': '30 días',
      'Propietario': 'Patricia Soto Miranda',
      'Rol': '1247-8',
    },
  },
  't-2': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Certificado de Hipotecas y Gravámenes',
      'CBR': 'Santiago',
      'Emitido': '12 de mayo de 2026',
      'Resultado': 'Sin hipotecas ni gravámenes vigentes',
    },
  },
  't-3': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Certificado de No Expropiación',
      'Municipalidad': 'Providencia',
      'Emitido': '10 de mayo de 2026',
    },
  },
  't-4': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Reglamento de Copropiedad',
      'Edificio': 'Los Leones 1240',
      'Notario': 'Fernando Undurraga Silva',
    },
  },
  't-5': {
    kind: 'con_observacion',
    reason: 'Los datos son legibles pero las imágenes están borrosas. Puedo optimizarlas automáticamente para que tu ejecutiva pueda validarlas, o puedes subir versiones más nítidas.',
    extractedFields: {
      'Tipo identificado': 'Inscripción del título en el CBR',
      'CBR': 'Santiago',
      'Calidad de imagen': 'baja',
    },
  },
  't-n-1': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Permiso de Edificación',
      'DOM': 'Providencia',
      'Proyecto': 'Edificio Los Almendros',
    },
  },
  't-n-2': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Recepción Definitiva',
      'DOM': 'Providencia',
      'Fecha': '22 de febrero de 2026',
    },
  },
  't-n-3': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Inscripción primer dueño en CBR',
      'CBR': 'Santiago',
      'Titular': 'Inmobiliaria Los Almendros',
    },
  },
  't-n-4': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Boletín Informativo del Proyecto',
      'Proyecto': 'Edificio Los Almendros',
      'Inmobiliaria': 'Inmobiliaria Los Almendros',
    },
  },
  't-n-5': {
    kind: 'con_observacion',
    reason: 'Los planos están en baja resolución, pero las medidas son legibles. Puedo optimizar para el validador.',
    extractedFields: {
      'Tipo identificado': 'Plano de la Unidad 1203',
      'Superficie útil': '92 m²',
      'Calidad de imagen': 'baja',
    },
  },
  'ts-1': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Solicitud de Tasación',
      'Perito asignado': 'Tasaciones Andes Ltda.',
    },
  },
  'ts-2': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Informe de Tasación',
      'Valor tasado': 'UF 6.850',
      'Perito': 'Tasaciones Andes Ltda.',
    },
  },
  'ts-3': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Aprobación del valor tasado',
      'Resultado': 'Aprobado para crédito de UF 4.760',
    },
  },
  'c-1': {
    kind: 'con_observacion',
    reason: 'Las veo un poco borrosas, pero puedo optimizarlas para que tu ejecutiva las valide sin problema, o puedes subir versiones más nítidas.',
    extractedFields: {
      'Tipo identificado': 'Liquidaciones de sueldo',
      'Períodos': 'Marzo, Abril, Mayo 2026',
      'Empleador': 'Servicios Andinos Limitada',
      'Calidad de imagen': 'baja',
    },
  },
  'c-2': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Certificado de Cotizaciones AFP',
      'AFP': 'Habitat',
      'Cotizaciones': '12 / 12',
    },
  },
  'c-3': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Carpeta Tributaria para Créditos',
      'Origen': 'sii.cl',
      'Vigencia': '60 días',
    },
  },
  'c-4': {
    kind: 'no_coincide',
    expected: 'Certificado de Antecedentes Comerciales (DICOM o Equifax)',
    detected: 'Certificado de Antecedentes Laborales',
  },
  'c-5': {
    kind: 'validado',
    extractedFields: {
      'Tipo identificado': 'Certificado de Matrimonio',
      'Origen': 'Registro Civil',
      'Estado': 'Vigente',
    },
  },
};

function buildInitialDocs(type: PropertyType): OperationDoc[] {
  const titulosDocs = type === 'nueva' ? DOCS_TITULOS_NUEVA : DOCS_TITULOS_USADA;
  const merge = (d: OperationDoc): OperationDoc => ({
    ...d,
    scriptedOutcome: SCRIPTED_OUTCOMES[d.id],
  });
  return [
    ...titulosDocs.map(merge),
    ...DOCS_TASACION.map(merge),
    ...DOCS_COMERCIAL.map(merge),
  ];
}

// ─── Seeds de notificaciones de bienvenida ─────────────────────

function buildWelcomeNotifications(): OperationNotification[] {
  return [
    {
      id: 'n-welcome',
      type: 'avance',
      targetActor: 'comprador',
      title: 'Tu hipoteca fue aprobada',
      body: 'Felicitaciones. Para avanzar, sube los documentos pendientes y paga los gastos operacionales.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
    },
    {
      id: 'n-pago',
      type: 'pago_pendiente',
      targetActor: 'comprador',
      title: 'Gastos operacionales pendientes',
      body: 'Para iniciar el estudio de títulos necesitamos que pagues UF 8 de gastos operacionales.',
      link: '/cliente/seguimiento',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      read: false,
    },
  ];
}

// ─── Estado inicial ─────────────────────────────────────────────

const INITIAL_PROPERTY_TYPE: PropertyType = 'usada';

const INITIAL_STATE = {
  propertyType: INITIAL_PROPERTY_TYPE,
  caseRef: BRAND.caseRef,
  approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  propertyAddress: `${BRAND.propertyAddress}, ${BRAND.propertyComuna}`,
  propertyValueUF: 6_800,
  loanAmountUF: 4_760,
  buyerName: BRAND.buyerName,
  sellerName: BRAND.sellerName,
  inmobiliariaName: BRAND.inmobiliariaName,
  ejecutivoName: BRAND.ejecutivoName,
  gastosOperacionalesUF: 8,
  gastosOperacionalesPaid: false,
  docs: buildInitialDocs(INITIAL_PROPERTY_TYPE),
  notifications: buildWelcomeNotifications(),
};

export const usePostApprovalStore = create<PostApprovalState>((set, get) => ({
  ...INITIAL_STATE,

  /**
   * Vuelve a tomar de BRAND los nombres del caso.
   *
   * La personalizacion guardada en /admin llega despues del arranque, cuando
   * este estado ya se creo con los valores del preset. Sin esta sincronizacion
   * la vista del cliente seguiria mostrando el nombre anterior.
   */
  syncFromBrand: () =>
    set({
      caseRef: BRAND.caseRef,
      propertyAddress: `${BRAND.propertyAddress}, ${BRAND.propertyComuna}`,
      buyerName: BRAND.buyerName,
      sellerName: BRAND.sellerName,
      inmobiliariaName: BRAND.inmobiliariaName,
      ejecutivoName: BRAND.ejecutivoName,
    }),

  setPropertyType: (t) =>
    set((s) => {
      // Preservar tasacion y comercial (no cambian con tipo de propiedad)
      const oldTasacion = s.docs.filter((d) => d.track === 'tasacion');
      const oldComercial = s.docs.filter((d) => d.track === 'comercial');
      const newTitulos = (t === 'nueva' ? DOCS_TITULOS_NUEVA : DOCS_TITULOS_USADA).map((d) => ({
        ...d,
        scriptedOutcome: SCRIPTED_OUTCOMES[d.id],
      }));
      return {
        propertyType: t,
        docs: [...newTitulos, ...oldTasacion, ...oldComercial],
      };
    }),

  uploadDoc: (docId, uploadedBy) =>
    set((s) => {
      const doc = s.docs.find((d) => d.id === docId);
      if (!doc) return s;
      const actualUploader = uploadedBy ?? doc.responsible;
      const uploaderName = actorFullName(actualUploader, s);
      const onBehalfOf = actualUploader !== doc.responsible
        ? ` en nombre de ${actorLabelShort(doc.responsible)}`
        : '';
      const now = new Date().toISOString();
      const entry: UploadEntry = {
        uploadedBy: actualUploader,
        uploadedByName: uploaderName,
        uploadedAt: now,
        note: onBehalfOf ? `Subido por ${uploaderName}${onBehalfOf}` : undefined,
      };
      const updated = s.docs.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'en_validacion' as DocStatus,
              uploadedAt: now,
              uploadedBy: actualUploader,
              uploadedByName: uploaderName,
              uploadHistory: [...(d.uploadHistory ?? []), entry],
            }
          : d,
      );
      const notif: OperationNotification = {
        id: `n-up-${docId}-${Date.now()}`,
        type: 'documento_subido',
        targetActor: 'ejecutivo',
        title: `Documento subido: ${doc.name}`,
        body: `${uploaderName}${onBehalfOf} subió "${doc.name}". En validación.`,
        createdAt: now,
        read: false,
        relatedDocId: docId,
      };
      return { docs: updated, notifications: [notif, ...s.notifications] };
    }),

  validateDoc: (docId) =>
    set((s) => {
      const updated = s.docs.map((d) =>
        d.id === docId
          ? { ...d, status: 'validado' as DocStatus, validatedAt: new Date().toISOString(), repairReason: undefined }
          : d,
      );
      return { docs: updated };
    }),

  raiseRepair: (docId, reason) =>
    set((s) => {
      const doc = s.docs.find((d) => d.id === docId);
      if (!doc) return s;
      const updated = s.docs.map((d) =>
        d.id === docId ? { ...d, status: 'con_reparo' as DocStatus, repairReason: reason } : d,
      );
      const notif: OperationNotification = {
        id: `n-rep-${docId}-${Date.now()}`,
        type: 'reparo',
        targetActor: doc.responsible,
        title: `Reparo en "${doc.name}"`,
        body: reason,
        link: linkForActor(doc.responsible),
        createdAt: new Date().toISOString(),
        read: false,
        relatedDocId: docId,
      };
      return { docs: updated, notifications: [notif, ...s.notifications] };
    }),

  resolveRepair: (docId, uploadedBy) =>
    set((s) => {
      const doc = s.docs.find((d) => d.id === docId);
      if (!doc) return s;
      const actualUploader = uploadedBy ?? doc.responsible;
      const uploaderName = actorFullName(actualUploader, s);
      const now = new Date().toISOString();
      const onBehalfOf = actualUploader !== doc.responsible
        ? ` en nombre de ${actorLabelShort(doc.responsible)}`
        : '';
      const entry: UploadEntry = {
        uploadedBy: actualUploader,
        uploadedByName: uploaderName,
        uploadedAt: now,
        note: `Resubida tras reparo${onBehalfOf}`,
      };
      const updated = s.docs.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'en_validacion' as DocStatus,
              uploadedAt: now,
              uploadedBy: actualUploader,
              uploadedByName: uploaderName,
              uploadHistory: [...(d.uploadHistory ?? []), entry],
              repairReason: undefined,
            }
          : d,
      );
      const notif: OperationNotification = {
        id: `n-resv-${docId}-${Date.now()}`,
        type: 'reparo_resuelto',
        targetActor: 'ejecutivo',
        title: `Reparo resuelto: ${doc.name}`,
        body: `${uploaderName}${onBehalfOf} resubió el documento corregido.`,
        createdAt: now,
        read: false,
        relatedDocId: docId,
      };
      return { docs: updated, notifications: [notif, ...s.notifications] };
    }),

  payGastos: () =>
    set((s) => {
      if (s.gastosOperacionalesPaid) return s;
      const notif: OperationNotification = {
        id: `n-pay-${Date.now()}`,
        type: 'avance',
        targetActor: 'ejecutivo',
        title: 'Gastos operacionales pagados',
        body: `${s.buyerName} pagó UF ${s.gastosOperacionalesUF}. El estudio de títulos puede iniciar.`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      return {
        gastosOperacionalesPaid: true,
        gastosOperacionalesPaidAt: new Date().toISOString(),
        notifications: [notif, ...s.notifications],
      };
    }),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: (actor) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        !actor || n.targetActor === actor ? { ...n, read: true } : n,
      ),
    })),

  resetOperation: () => set({ ...INITIAL_STATE }),
}));

// ─── Selectors helpers ─────────────────────────────────────────

export function docsByTrack(docs: OperationDoc[], track: TrackKey): OperationDoc[] {
  return docs.filter((d) => d.track === track);
}

export function trackProgress(docs: OperationDoc[], track: TrackKey): number {
  const tDocs = docsByTrack(docs, track).filter((d) => !d.optional);
  if (tDocs.length === 0) return 0;
  const done = tDocs.filter((d) => d.status === 'validado').length;
  return Math.round((done / tDocs.length) * 100);
}

export function unreadCount(notifications: OperationNotification[], actor: Actor): number {
  return notifications.filter((n) => n.targetActor === actor && !n.read).length;
}

export function notificationsForActor(
  notifications: OperationNotification[],
  actor: Actor,
): OperationNotification[] {
  return notifications.filter((n) => n.targetActor === actor);
}

export function activeRepairsForActor(docs: OperationDoc[], actor: Actor): OperationDoc[] {
  return docs.filter((d) => d.responsible === actor && d.status === 'con_reparo');
}

function actorLabel(a: Actor): string {
  switch (a) {
    case 'comprador': return 'El comprador';
    case 'vendedor': return 'El vendedor';
    case 'inmobiliaria': return 'La inmobiliaria';
    case 'ejecutivo': return 'El ejecutivo';
  }
}

function actorLabelShort(a: Actor): string {
  switch (a) {
    case 'comprador': return 'el comprador';
    case 'vendedor': return 'el vendedor o la vendedora';
    case 'inmobiliaria': return 'la inmobiliaria';
    case 'ejecutivo': return 'el ejecutivo';
  }
}

function actorFullName(a: Actor, state: PostApprovalState): string {
  switch (a) {
    case 'comprador': return state.buyerName;
    case 'vendedor': return state.sellerName;
    case 'inmobiliaria': return state.inmobiliariaName;
    case 'ejecutivo': return state.ejecutivoName;
  }
}

function linkForActor(a: Actor): string {
  switch (a) {
    case 'comprador': return '/cliente/seguimiento';
    case 'vendedor': return '/vendedor';
    case 'inmobiliaria': return '/inmobiliaria/proyectos';
    case 'ejecutivo': return '/ejecutivo';
  }
}

export const ACTOR_LABEL: Record<Actor, string> = {
  comprador: 'Comprador',
  vendedor: 'Vendedor',
  inmobiliaria: 'Inmobiliaria',
  ejecutivo: 'Ejecutivo Banco',
};
