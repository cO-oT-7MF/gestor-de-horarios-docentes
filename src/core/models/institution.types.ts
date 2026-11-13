import type { TimeSlotConfig, Group } from '../../types';

export type InstitutionType = 'SEP_PUBLICA' | 'COLEGIO_PARTICULAR';
export type InstitutionShift = 'Matutino' | 'Vespertino' | 'Tiempo Completo';

export interface BrandThemeTokens {
  '--brand-primary': string;
  '--brand-primary-foreground': string;
  '--brand-surface': string;
  '--brand-surface-elevated': string;
  '--brand-accent': string;
  '--brand-border': string;
}

export interface InstitutionConfig {
  cct: string; // Ej. "11EES0119S"
  name: string; // Ej. "Secundaria Nº 111"
  schoolYear: string; // Ej. "2027-2028"
  shift: InstitutionShift;
  periodsPerDay: number; // 7 periodos estándar en secundaria
  groupsByGrade: Record<1 | 2 | 3, string[]>; // Ej. { 1: ['1A', '1B'...], 2: [...], 3: [...] }
}

export interface PlantelPreset extends InstitutionConfig {
  workCenterKey: string;
  shiftLabel: 'TURNO MATUTINO' | 'TURNO VESPERTINO';
  zone: string;
  regionalUnit: string;
  institutionType: InstitutionType;
  brandTokens: BrandThemeTokens;
  groups: Group[];
  timeSlots: TimeSlotConfig[];
}

export interface MultiPlantelRegistry {
  activeCct: string;
  institutions: PlantelPreset[];
}
