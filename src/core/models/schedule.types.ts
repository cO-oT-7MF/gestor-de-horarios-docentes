import type {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  AcademicLoadItem,
  DutyAssignment,
  SubstitutionAssignment,
  Conflict,
  GradeLevel,
} from '../../types';

export type PeriodIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ScheduleSlot {
  day: DayOfWeek;
  period: PeriodIndex;
  groupId: string; // Ej. "1A", "2B", "3C"
  subject: string;
  teacherId: string;
  classroom?: string;
}

export interface ClassroomResource {
  id: string;
  name: string; // e.g., 'Aula 1A', 'Lab. Ciencias', 'Taller Cómputo'
  capacity?: number;
  type: 'AULA_GENERAL' | 'LABORATORIO' | 'TALLER' | 'CANCHAS';
}

export interface ScheduleBlock extends ScheduleEntry {
  cct?: string;
  classroomId?: string;
  isLocked?: boolean;
  isRigidConstraint?: boolean;
}

export interface CurriculumSubjectRule {
  subjectId: string;
  name: string;
  shortName: string;
  campoFormativo:
    | 'Lenguajes'
    | 'Saberes y Pensamiento Científico'
    | 'Ética, Naturaleza y Sociedades'
    | 'De lo Humano y lo Comunitario'
    | 'Integración Curricular';
  hoursPerGrade: Record<GradeLevel, number>;
  requiresLabOrWorkshop?: boolean;
  maxConsecutivePerDay?: number;
}

export interface AutoGeneratorRequest {
  cct: string;
  cycle: string;
  groups: { id: string; grade: GradeLevel; name: string }[];
  academicLoads: AcademicLoadItem[];
  teacherProfiles: {
    teacherId: string;
    teacherName: string;
    rfc?: string;
    regimenLaboral: 'BASE' | 'CONTRATO' | 'INTERINATO';
    horasBase: number;
    horasContrato: number;
    diaLibreSugerido?: DayOfWeek | 'NINGUNO';
    momentoHorario: 'RECESO' | 'ANTES' | 'DESPUES' | 'COMPLETO';
    sharesDoubleShift?: boolean;
    preferredSlots?: TimeSlotId[];
  }[];
  lockedEntries?: ScheduleEntry[];
  curriculumRules?: CurriculumSubjectRule[];
}

export interface AutoGeneratorResult {
  entries: ScheduleEntry[];
  conflicts: Conflict[];
  stats: {
    totalAssigned: number;
    totalRequested: number;
    unassignedCount: number;
    totalBridgeHours: number;
    elapsedMs: number;
  };
  unassignedDetails: {
    teacherName: string;
    groupId: string;
    subject: string;
    remainingHours: number;
    reason: string;
  }[];
}

export interface SyncMutation {
  id: string;
  timestamp: string;
  type: 'UPSERT_SCHEDULE' | 'DELETE_SLOT' | 'ASSIGN_DUTY' | 'ASSIGN_SUBSTITUTION' | 'UPDATE_INSTITUTION';
  payload: unknown;
  synced: boolean;
}

export interface CycleSnapshot {
  cct: string;
  cycle: string;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  dutyAssignments: DutyAssignment[];
  substitutionAssignments: SubstitutionAssignment[];
  updatedAt: string;
}
