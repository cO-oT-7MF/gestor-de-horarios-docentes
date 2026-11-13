import type { PlantelPreset } from '../../core/models/institution.types';
import { getTimeSlotsForShift, GROUPS } from '../initialData';

const DEFAULT_GROUPS_BY_GRADE: Record<1 | 2 | 3, string[]> = {
  1: GROUPS.filter((g) => g.grade === 1).map((g) => g.id),
  2: GROUPS.filter((g) => g.grade === 2).map((g) => g.id),
  3: GROUPS.filter((g) => g.grade === 3).map((g) => g.id),
};

export const PRESET_11EES0119S: PlantelPreset = {
  cct: '11EES0119S',
  name: 'Escuela Secundaria General Nº 111',
  workCenterKey: 'CCT 11EES0119S',
  shift: 'Matutino',
  shiftLabel: 'TURNO MATUTINO',
  schoolYear: '2027-2028',
  periodsPerDay: 7,
  groupsByGrade: DEFAULT_GROUPS_BY_GRADE,
  zone: 'Zona Escolar 04',
  regionalUnit: 'Unidad Regional 11',
  institutionType: 'SEP_PUBLICA',
  brandTokens: {
    '--brand-primary': '#0f766e',
    '--brand-primary-foreground': '#ffffff',
    '--brand-surface': '#0a0d12',
    '--brand-surface-elevated': '#11161f',
    '--brand-accent': '#f59e0b',
    '--brand-border': 'rgba(20, 184, 166, 0.25)',
  },
  groups: GROUPS,
  timeSlots: getTimeSlotsForShift('TURNO MATUTINO'),
};

export const PRESET_19EES0129S: PlantelPreset = {
  cct: '19EES0129S',
  name: 'Escuela Secundaria Nº 129 "Gral. Félix U. Gómez"',
  workCenterKey: 'CT 19EES0129S',
  shift: 'Vespertino',
  shiftLabel: 'TURNO VESPERTINO',
  schoolYear: '2027-2028',
  periodsPerDay: 7,
  groupsByGrade: DEFAULT_GROUPS_BY_GRADE,
  zone: 'Zona Escolar 07',
  regionalUnit: 'Región 19',
  institutionType: 'SEP_PUBLICA',
  brandTokens: {
    '--brand-primary': '#d97706',
    '--brand-primary-foreground': '#0a0a0a',
    '--brand-surface': '#0a0a0a',
    '--brand-surface-elevated': '#111318',
    '--brand-accent': '#38bdf8',
    '--brand-border': 'rgba(245, 158, 11, 0.25)',
  },
  groups: GROUPS,
  timeSlots: getTimeSlotsForShift('TURNO VESPERTINO'),
};

export const PRESET_COLEGIO_PARTICULAR: PlantelPreset = {
  cct: '11PES0099X',
  name: 'Instituto Académico Integral (White-Label)',
  workCenterKey: 'CCT 11PES0099X',
  shift: 'Tiempo Completo',
  shiftLabel: 'TURNO MATUTINO',
  schoolYear: '2027-2028',
  periodsPerDay: 7,
  groupsByGrade: DEFAULT_GROUPS_BY_GRADE,
  zone: 'Sector Privado 01',
  regionalUnit: 'Dirección Académica',
  institutionType: 'COLEGIO_PARTICULAR',
  brandTokens: {
    '--brand-primary': '#4f46e5',
    '--brand-primary-foreground': '#ffffff',
    '--brand-surface': '#090b14',
    '--brand-surface-elevated': '#121629',
    '--brand-accent': '#10b981',
    '--brand-border': 'rgba(99, 102, 241, 0.28)',
  },
  groups: GROUPS,
  timeSlots: getTimeSlotsForShift('TURNO MATUTINO'),
};

export const INSTITUTION_PRESETS: PlantelPreset[] = [
  PRESET_11EES0119S,
  PRESET_19EES0129S,
  PRESET_COLEGIO_PARTICULAR,
];

export function getInstitutionPresetByCct(cct: string): PlantelPreset {
  return (
    INSTITUTION_PRESETS.find((p) => p.cct.toUpperCase() === cct.trim().toUpperCase()) ||
    PRESET_11EES0119S
  );
}
