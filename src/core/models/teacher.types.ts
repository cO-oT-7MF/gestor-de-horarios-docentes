import type { DayOfWeek as LegacyDayOfWeek, TimeSlotId, Teacher } from '../../types';
export type { InstitutionConfig } from './institution.types';
export type { ScheduleSlot, PeriodIndex } from './schedule.types';

export type LaborRegime = 'Base' | 'Contrato' | 'Interinato';
export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface TeacherContact {
  institutionalEmail: string;
  whatsappInternational: string; // Formato E.164 sin '+', ej. "528112345678"
}

export interface TeacherRecord {
  id: string;
  rfc: string; // Identificador de acceso para rol docente
  curp?: string;
  budgetKey?: string; // Clave presupuestal SEP
  fullName: string;
  baseSubject: string;
  contractHours: number; // Horas base o de contrato
  assignedHours: number; // Calculado dinámicamente desde la matriz
  regime: LaborRegime;
  suggestedDayOff?: DayOfWeek;
  preferredTimeSlot?: 'Antes' | 'RECESO' | 'Después' | 'Indistinto';
  availabilityNotes?: string;
  contact: TeacherContact;
}

export type RegimenLaboral = 'BASE' | 'CONTRATO' | 'INTERINATO';
export type MomentoHorario = 'RECESO' | 'ANTES' | 'DESPUES' | 'COMPLETO';

export interface TeacherProfile extends Teacher {
  rfc: string;
  curp?: string;
  clavePresupuestal?: string;
  horasBase: number;
  horasContrato: number;
  regimenLaboral: RegimenLaboral;
  diaLibreSugerido?: LegacyDayOfWeek | 'NINGUNO';
  momentoHorario: MomentoHorario;
  sharesDoubleShift?: boolean;
  preferredSlots?: TimeSlotId[];
  avoidRecess?: boolean;
}

export interface SheetSyncRow {
  rfc: string;
  curp?: string;
  nombre: string;
  clavePresupuestal?: string;
  asignatura: string;
  horasBase: number;
  horasContrato: number;
  regimenLaboral: RegimenLaboral;
  diaLibreSugerido?: LegacyDayOfWeek | 'NINGUNO';
  momentoHorario: MomentoHorario;
  gruposSugeridos?: string[];
  email?: string;
  whatsapp?: string;
}
