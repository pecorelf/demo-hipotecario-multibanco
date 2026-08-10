// ============================================================
// DOCUMENT TRACKING STORE
// Gestiona el estado de los documentos del cliente y notifs.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DocumentItem,
  DocStatus,
  initialDocuments,
  mockAnalyze,
} from '../data/documentAgent';

export type Notification = {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  docId?: string;
};

type DocsState = {
  documents: DocumentItem[];
  notifications: Notification[];

  // Acciones
  uploadDocument: (docId: string, fileName: string) => Promise<void>;
  setDocStatus: (docId: string, status: DocStatus) => void;
  markNotifRead: (notifId: string) => void;
  markAllNotifsRead: () => void;
  resetDemo: () => void;
};

function nowString(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `Hoy ${hh}:${mm}`;
}

const initialNotifications: Notification[] = [
  {
    id: 'n-001',
    type: 'success',
    title: 'Cédula aprobada',
    body: 'Verificamos tu cédula de identidad. Todo en orden.',
    timestamp: 'Hace 2 horas',
    read: false,
    docId: 'doc-001',
  },
  {
    id: 'n-002',
    type: 'warning',
    title: 'Liquidación con reparo',
    body: 'Tu liquidación de sueldo necesita atención. Toca para ver el detalle.',
    timestamp: 'Hace 1 hora',
    read: false,
    docId: 'doc-002',
  },
  {
    id: 'n-003',
    type: 'info',
    title: 'Certificado AFP en revisión',
    body: 'Estamos procesando tu certificado de cotizaciones.',
    timestamp: 'Hace 30 minutos',
    read: false,
    docId: 'doc-003',
  },
];

export const useDocsStore = create<DocsState>()(
  persist(
    (set, get) => ({
      documents: initialDocuments,
      notifications: initialNotifications,

      // Simula la subida + análisis del agente IA
      uploadDocument: async (docId: string, fileName: string) => {
        // 1) Inicia upload
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId ? { ...d, status: 'uploading' as DocStatus, fileName } : d
          ),
        }));
        await new Promise((r) => setTimeout(r, 800));

        // 2) Pasa a analyzing
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId ? { ...d, status: 'analyzing' as DocStatus } : d
          ),
        }));
        await new Promise((r) => setTimeout(r, 2800));

        // 3) Aplica resultado del mock
        const result = mockAnalyze(docId, fileName);
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status: result.status as DocStatus,
                  uploadedAt: nowString(),
                  extractedFields: result.extractedFields,
                  repair: result.repair,
                }
              : d
          ),
        }));

        // 4) Genera notificación
        const doc = get().documents.find((d) => d.id === docId);
        if (doc) {
          const newNotif: Notification = {
            id: `n-${Date.now()}`,
            type: result.status === 'approved' ? 'success' : 'warning',
            title:
              result.status === 'approved'
                ? `${doc.name} aprobado`
                : `${doc.name} necesita atención`,
            body:
              result.status === 'approved'
                ? 'Verificamos tu documento. Todo en orden.'
                : result.repair?.title || 'Hay un reparo en este documento.',
            timestamp: 'Hace un instante',
            read: false,
            docId: docId,
          };
          set((s) => ({ notifications: [newNotif, ...s.notifications] }));
        }
      },

      setDocStatus: (docId, status) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === docId ? { ...d, status } : d
          ),
        })),

      markNotifRead: (notifId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === notifId ? { ...n, read: true } : n
          ),
        })),

      markAllNotifsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      resetDemo: () =>
        set({
          documents: initialDocuments,
          notifications: initialNotifications,
        }),
    }),
    {
      name: 'hipotecia-docs-store',
      version: 1,
    }
  )
);
