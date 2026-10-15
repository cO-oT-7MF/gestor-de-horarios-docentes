export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export type TimeSlotId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeSlotConfig {
  id: TimeSlotId;
  name: string;
  startTime: string;
  endTime: string;
  isRecessBefore?: boolean;
  recessBeforeLabel?: string;
  isRecessAfter?: boolean;
  recessLabel?: string;
  isSplit?: boolean;
  splitPart1?: { name: string; startTime: string; endTime: string; duration: number };
  splitRecess?: { name: string; startTime: string; endTime: string; duration: number };
  splitPart2?: { name: string; startTime: string; endTime: string; duration: number };
}

export type GradeLevel = 1 | 2 | 3;

export type StaggeredBreakSegmentId = 1 | 2 | 3;

export interface StaggeredBreakSegment {
  segmentId: StaggeredBreakSegmentId;
  targetGrade: GradeLevel;
  startTime: string; // '15:00', '15:20', '15:40'
  endTime: string;   // '15:20', '15:40', '16:00'
  durationMinutes: number; // 20
  label: string; // '1er Receso (1º Grado)'
  description: string;
}

export interface BreakDutyTeacher {
  teacherName: string;
  teacherId?: string;
  payrollId?: string;
  source: 'assigned_grade_recess' | 'no_class_in_period';
  assignedGroup?: string;
  assignedSubject?: string;
  statusLabel: string;
  totalWeeklyHours?: number;
}

export interface BreakTeachingTeacher {
  teacherName: string;
  teacherId?: string;
  payrollId?: string;
  groupId: string;
  grade: GradeLevel;
  subject: string;
  statusDescription: string;
}

export interface BreakSegmentAvailability {
  segmentId: StaggeredBreakSegmentId;
  targetGrade: GradeLevel;
  startTime: string;
  endTime: string;
  label: string;
  description: string;
  dutyEligibleTeachers: BreakDutyTeacher[];
  teachingTeachers: BreakTeachingTeacher[];
}

export interface Group {
  id: string; // e.g. "1A", "1B", "2A", "3H"
  name: string; // e.g. "1ºA", "1ºB", "2ºA", "3ºH"
  grade: GradeLevel;
  section: string; // "A", "B", "C", ...
  advisor?: string; // Standardized teacher name
  advisorTeacherId?: string; // Standardized teacher unique ID
}

export interface SubjectConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  borderColor: string;
  bgLight: string;
  bgDark?: string;
  borderDark?: string;
  textDark?: string;
  hoursPerGrade: {
    1: number;
    2: number;
    3: number;
  };
}

export type TeacherStatus = 'active' | 'inactive' | 'no_workload';

export interface Teacher {
  id: string; // Unique standardized identifier (e.g., 'DOC-BRENDA-S' or UUID/RFC)
  name: string; // Standardized canonical display name
  payrollId?: string; // RFC or Payroll ID
  status?: TeacherStatus; // 'active' | 'inactive' | 'no_workload'
  mainSubject?: string;
  subjectId?: string; // Standardized subject ID
  maxHours?: number; // Maximum contracted hours (e.g., 30, 35, 42)
  contractHours?: number; // Contracted hours
  aliases?: string[]; // Formatting variations and recognized aliases
  preferredSlots?: TimeSlotId[]; // Specific allowable / preferred periods (e.g. 1 to 7)
  email?: string;
  phone?: string;
  whatsapp?: string; // Phone number in international format (+52 55 ...) for WhatsApp chat
}

export interface ScheduleEntry {
  id: string;
  day: DayOfWeek;
  slot: TimeSlotId;
  groupId: string;
  teacherName: string;
  teacherId?: string; // Standardized teacher unique ID
  subject: string;
  subjectId?: string; // Standardized subject unique ID
  room?: string;
}

export type ConflictType =
  | 'TEACHER_OVERLAP'
  | 'GROUP_OVERLAP'
  | 'HOURS_MISMATCH'
  | 'UNASSIGNED_HOURS'
  | 'OVERASSIGNED_HOURS';

export interface Conflict {
  id: string;
  type: ConflictType;
  day?: DayOfWeek;
  slot?: TimeSlotId;
  teacherName?: string;
  groupId?: string;
  subject?: string;
  description: string;
  affectedEntries: ScheduleEntry[];
  severity: 'error' | 'warning';
  scheduledHours?: number;
  expectedHours?: number;
  difference?: number;
}

export interface AcademicLoadItem {
  groupId: string;
  groupName: string;
  grade: GradeLevel;
  advisor: string;
  advisorTeacherId?: string; // Standardized advisor teacher unique ID
  subjects: {
    [subjectName: string]: {
      teacherName: string;
      teacherId?: string; // Standardized teacher unique ID
      subjectId?: string; // Standardized subject unique ID
      hours: number;
      specificSlots?: TimeSlotId[];
    };
  };
}

export interface SchoolInfo {
  name: string;
  schoolYear: string;
  zone: string;
  workCenterKey: string; // C.T.
  regionalUnit: string;
  shift: string; // Turno Matutino
}

export type DutyZone =
  | 'Patio Central'
  | 'Canchas Deportivas'
  | 'Portón y Acceso Principal'
  | 'Pasillos y Sanitarios'
  | 'Cafetería / Comedor'
  | 'Biblioteca / Aulas Exteriores'
  | 'Otra Zona';

export interface DutyAssignment {
  id: string;
  teacherName: string;
  teacherId?: string;
  payrollId?: string;
  day: DayOfWeek;
  slot: TimeSlotId;
  breakSegmentId?: StaggeredBreakSegmentId; // 1, 2, 3 for 4th period
  zone: DutyZone;
  notes?: string;
  assignedAt: string;
}

export interface SubstitutionAssignment {
  id: string;
  substituteTeacherName: string;
  substituteTeacherId?: string;
  absentTeacherName: string;
  absentTeacherId?: string;
  day: DayOfWeek;
  slot: TimeSlotId;
  breakSegmentId?: StaggeredBreakSegmentId;
  groupId: string;
  subject: string;
  reason?: string;
  notes?: string;
  assignedAt: string;
}

export interface LastKnownGoodState {
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  customTimeSlots?: TimeSlotConfig[];
  timestamp: string;
  version?: string;
}
