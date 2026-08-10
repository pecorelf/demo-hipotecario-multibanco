import { create } from 'zustand';
import type { Case, Customer, OnboardingCase, Role } from '@/types';
import { BRAND } from '@/lib/brand';

export interface DerivationRecord {
  caseId: string;
  note: string;
  derivedAt: string;
  byExecutiveId: string;
}

export interface ChosenScenario {
  id: 'menor_cuota' | 'equilibrado' | 'menor_costo';
  label: string;
  termYears: number;
  nominalRate: number;
  caeRate: number;
  monthlyCLP: number;
}

export interface PropertyInput {
  address: string;
  commune: string;
  priceUF: number;
  /** Lo que aporta el cliente como pie, en UF */
  downPaymentUF: number;
  /** Lo que va a financiar (priceUF - downPaymentUF) */
  loanAmountUF: number;
}

interface AppStore {
  currentRole: Role;
  currentCaseId: string | null;
  onboardingCase: OnboardingCase | null;
  derivedCases: Record<string, DerivationRecord>;
  audioCase: Case | null;
  audioCustomer: Customer | null;
  audioCoTitular: Customer | null;
  clientLoggedIn: boolean;
  clientFlow: 'unset' | 'santander_client' | 'not_a_client';
  onboardingMode: 'unchosen' | 'conversational' | 'form';
  propertyInput: PropertyInput | null;
  chosenScenario: ChosenScenario | null;
  setRole: (role: Role) => void;
  setCase: (caseId: string | null) => void;
  setOnboardingCase: (oc: OnboardingCase | null) => void;
  clearOnboardingCase: () => void;
  deriveCase: (record: DerivationRecord) => void;
  clearDerivation: (caseId: string) => void;
  createAudioCase: (c: Case, customer: Customer, coTitular?: Customer | null) => void;
  clearAudioCase: () => void;
  loginClient: () => void;
  logoutClient: () => void;
  setClientFlow: (flow: 'unset' | 'santander_client' | 'not_a_client') => void;
  setOnboardingMode: (mode: 'unchosen' | 'conversational' | 'form') => void;
  setPropertyInput: (p: PropertyInput | null) => void;
  setChosenScenario: (s: ChosenScenario | null) => void;
  resetOnboardingFlow: () => void;
  resetAll: () => void;
}

const INITIAL_STATE = {
  currentRole: 'cliente' as Role,
  currentCaseId: 'HIP-2026-0042',
  onboardingCase: null,
  derivedCases: {},
  audioCase: null,
  audioCustomer: null,
  audioCoTitular: null,
  clientLoggedIn: false,
  clientFlow: 'unset' as const,
  onboardingMode: 'unchosen' as const,
  propertyInput: null,
  chosenScenario: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...INITIAL_STATE,
  setRole: (role) => set({ currentRole: role }),
  setCase: (caseId) => set({ currentCaseId: caseId }),
  setOnboardingCase: (oc) => set({ onboardingCase: oc }),
  clearOnboardingCase: () => set({ onboardingCase: null }),
  deriveCase: (record) =>
    set((s) => ({ derivedCases: { ...s.derivedCases, [record.caseId]: record } })),
  clearDerivation: (caseId) =>
    set((s) => {
      const next = { ...s.derivedCases };
      delete next[caseId];
      return { derivedCases: next };
    }),
  createAudioCase: (c, customer, coTitular = null) =>
    set({ audioCase: c, audioCustomer: customer, audioCoTitular: coTitular }),
  clearAudioCase: () => set({ audioCase: null, audioCustomer: null, audioCoTitular: null }),
  loginClient: () => set({ clientLoggedIn: true }),
  logoutClient: () => set({ clientLoggedIn: false }),
  setClientFlow: (flow) => set({ clientFlow: flow }),
  setOnboardingMode: (mode) => set({ onboardingMode: mode }),
  setPropertyInput: (p) => set({ propertyInput: p }),
  setChosenScenario: (s) => set({ chosenScenario: s }),
  resetOnboardingFlow: () =>
    set({
      onboardingCase: null,
      chosenScenario: null,
      propertyInput: null,
      clientFlow: 'unset',
      clientLoggedIn: false,
      onboardingMode: 'unchosen',
    }),
  resetAll: () => set({ ...INITIAL_STATE }),
}));

export const ROLE_LABEL: Record<Role, string> = {
  cliente: 'Cliente',
  ejecutivo: `Ejecutivo ${BRAND.shortName}`,
  backoffice: 'Back office',
  jefatura: 'Vista Ejecutiva de Producto',
  operaciones: 'Operaciones',
  gobierno: 'Tecnología y Riesgo',
  inmobiliaria: 'Corredora inmobiliaria',
};

export const ROLE_HOME: Record<Role, string> = {
  cliente: '/cliente',
  ejecutivo: '/ejecutivo',
  backoffice: '/backoffice',
  jefatura: '/jefatura',
  operaciones: '/operaciones',
  gobierno: '/governance',
  inmobiliaria: '/inmobiliaria',
};
