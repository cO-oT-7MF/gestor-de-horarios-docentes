import {
  DayOfWeek,
  Group,
  SchoolInfo,
  SubjectConfig,
  TimeSlotConfig,
  AcademicLoadItem,
  ScheduleEntry,
} from '../types';
import { standardizeTeacherName, getCanonicalTeacherId } from './teacherCatalog';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: 'ESCUELA SECUNDARIA Nº 129 "GRAL. FÉLIX U. GÓMEZ"',
  schoolYear: 'CICLO ESCOLAR 2026-2027',
  zone: 'ZONA ESCOLAR 34',
  workCenterKey: 'CT 19EES0129S',
  regionalUnit: 'UNIDAD REGIONAL 6',
  shift: 'TURNO VESPERTINO',
};

export const STAGGERED_BREAKS_VESPERTINO = [
  {
    grade: 1,
    name: '1º Grado',
    startTime: '15:00',
    endTime: '15:20',
    durationMinutes: 20,
    slot: 4,
    label: 'Receso 1º Grado (15:00 - 15:20)',
    description: 'Receso al inicio del bloque de las 3:00 PM; clase de 15:20 a 16:00 (40 min)',
  },
  {
    grade: 2,
    name: '2º Grado',
    startTime: '15:20',
    endTime: '15:40',
    durationMinutes: 20,
    slot: 4,
    label: 'Receso 2º Grado (15:20 - 15:40)',
    description: 'Clase dividida: 20 min antes (15:00-15:20) y 20 min después (15:40-16:00)',
    isSplitClass: true,
  },
  {
    grade: 3,
    name: '3º Grado',
    startTime: '15:40',
    endTime: '16:00',
    durationMinutes: 20,
    slot: 4,
    label: 'Receso 3º Grado (15:40 - 16:00)',
    description: 'Clase de 15:00 a 15:40 (40 min); receso al final del bloque de las 3:00 PM',
  },
];

export const TIME_SLOTS_VESPERTINO_GRADE_1: TimeSlotConfig[] = [
  { id: 1, name: '1º Módulo', startTime: '13:00', endTime: '13:40' },
  { id: 2, name: '2º Módulo', startTime: '13:40', endTime: '14:20' },
  { id: 3, name: '3º Módulo', startTime: '14:20', endTime: '15:00', isRecessAfter: true, recessLabel: '☕ Receso 1º Grado (15:00 - 15:20 • 20 min)' },
  { id: 4, name: '4º Módulo', startTime: '15:20', endTime: '16:00' },
  { id: 5, name: '5º Módulo', startTime: '16:00', endTime: '16:40' },
  { id: 6, name: '6º Módulo', startTime: '16:40', endTime: '17:20' },
  { id: 7, name: '7º Módulo', startTime: '17:20', endTime: '18:00' },
];

export const TIME_SLOTS_VESPERTINO_GRADE_2: TimeSlotConfig[] = [
  { id: 1, name: '1º Módulo', startTime: '13:00', endTime: '13:40' },
  { id: 2, name: '2º Módulo', startTime: '13:40', endTime: '14:20' },
  { id: 3, name: '3º Módulo', startTime: '14:20', endTime: '15:00' },
  {
    id: 4,
    name: '4º Módulo',
    startTime: '15:00',
    endTime: '16:00',
    isSplit: true,
    splitPart1: { name: '4º Módulo (Parte 1)', startTime: '15:00', endTime: '15:20', duration: 20 },
    splitRecess: { name: '☕ Receso 2º Grado', startTime: '15:20', endTime: '15:40', duration: 20 },
    splitPart2: { name: '4º Módulo (Parte 2)', startTime: '15:40', endTime: '16:00', duration: 20 },
    recessLabel: '☕ Receso 2º Grado (15:20 - 15:40 • 20 min)',
  },
  { id: 5, name: '5º Módulo', startTime: '16:00', endTime: '16:40' },
  { id: 6, name: '6º Módulo', startTime: '16:40', endTime: '17:20' },
  { id: 7, name: '7º Módulo', startTime: '17:20', endTime: '18:00' },
];

export const TIME_SLOTS_VESPERTINO_GRADE_3: TimeSlotConfig[] = [
  { id: 1, name: '1º Módulo', startTime: '13:00', endTime: '13:40' },
  { id: 2, name: '2º Módulo', startTime: '13:40', endTime: '14:20' },
  { id: 3, name: '3º Módulo', startTime: '14:20', endTime: '15:00' },
  { id: 4, name: '4º Módulo', startTime: '15:00', endTime: '15:40', isRecessAfter: true, recessLabel: '☕ Receso 3º Grado (15:40 - 16:00 • 20 min)' },
  { id: 5, name: '5º Módulo', startTime: '16:00', endTime: '16:40' },
  { id: 6, name: '6º Módulo', startTime: '16:40', endTime: '17:20' },
  { id: 7, name: '7º Módulo', startTime: '17:20', endTime: '18:00' },
];

// General Vespertino slots (1:00 PM to 6:00 PM / 13:00 - 18:00, 40-minute periods, with 3:00 PM - 4:00 PM break block)
export const TIME_SLOTS_VESPERTINO: TimeSlotConfig[] = [
  { id: 1, name: '1º Módulo', startTime: '13:00', endTime: '13:40' },
  { id: 2, name: '2º Módulo', startTime: '13:40', endTime: '14:20' },
  { id: 3, name: '3º Módulo', startTime: '14:20', endTime: '15:00' },
  {
    id: 4,
    name: '4º Módulo',
    startTime: '15:00',
    endTime: '16:00',
    isRecessAfter: true,
    recessLabel: '☕ Recesos Escalonados de 20 min (15:00 - 16:00 • 1º: 15:00-15:20 | 2º: 15:20-15:40 | 3º: 15:40-16:00)',
  },
  { id: 5, name: '5º Módulo', startTime: '16:00', endTime: '16:40' },
  { id: 6, name: '6º Módulo', startTime: '16:40', endTime: '17:20' },
  { id: 7, name: '7º Módulo', startTime: '17:20', endTime: '18:00' },
];

export const TIME_SLOTS_MATUTINO: TimeSlotConfig[] = [
  { id: 1, name: '1º Módulo', startTime: '07:00', endTime: '07:40' },
  { id: 2, name: '2º Módulo', startTime: '07:40', endTime: '08:20', isRecessAfter: true, recessLabel: '☕ Receso 1º Grado (08:20 - 08:40)' },
  { id: 3, name: '3º Módulo', startTime: '08:20', endTime: '09:00', isRecessAfter: true, recessLabel: '☕ Receso 2º Grado (09:00 - 09:20)' },
  { id: 4, name: '4º Módulo', startTime: '09:00', endTime: '09:40', isRecessAfter: true, recessLabel: '☕ Receso 3º Grado (09:40 - 10:00)' },
  { id: 5, name: '5º Módulo', startTime: '10:00', endTime: '10:40' },
  { id: 6, name: '6º Módulo', startTime: '10:40', endTime: '11:20' },
  { id: 7, name: '7º Módulo', startTime: '11:20', endTime: '12:00' },
];

export function getTimeSlotsForShift(shiftName: string, grade?: 1 | 2 | 3): TimeSlotConfig[] {
  const isMatutino = shiftName && shiftName.toUpperCase().includes('MATUTINO');
  if (isMatutino) {
    return TIME_SLOTS_MATUTINO;
  }
  if (grade === 1) return TIME_SLOTS_VESPERTINO_GRADE_1;
  if (grade === 2) return TIME_SLOTS_VESPERTINO_GRADE_2;
  if (grade === 3) return TIME_SLOTS_VESPERTINO_GRADE_3;
  return TIME_SLOTS_VESPERTINO;
}

// Default export uses Turno Vespertino as primary
export const TIME_SLOTS: TimeSlotConfig[] = TIME_SLOTS_VESPERTINO;

export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'espanol',
    name: 'Español',
    shortName: 'Español',
    color: '#2563eb', // Blue
    textColor: '#1e40af',
    borderColor: '#93c5fd',
    bgLight: '#eff6ff',
    bgDark: 'rgba(30, 58, 138, 0.35)',
    borderDark: 'rgba(59, 130, 246, 0.45)',
    textDark: '#93c5fd',
    hoursPerGrade: { 1: 5, 2: 5, 3: 5 },
  },
  {
    id: 'matematicas',
    name: 'Matemáticas',
    shortName: 'Matem.',
    color: '#dc2626', // Red
    textColor: '#991b1b',
    borderColor: '#fca5a5',
    bgLight: '#fef2f2',
    bgDark: 'rgba(159, 18, 57, 0.35)',
    borderDark: 'rgba(244, 63, 94, 0.45)',
    textDark: '#fca5a5',
    hoursPerGrade: { 1: 5, 2: 5, 3: 5 },
  },
  {
    id: 'ciencias',
    name: 'Ciencias',
    shortName: 'Ciencias',
    color: '#059669', // Emerald Green (Biología 1º, Física 2º, Química 3º)
    textColor: '#065f46',
    borderColor: '#6ee7b7',
    bgLight: '#ecfdf5',
    bgDark: 'rgba(6, 78, 59, 0.4)',
    borderDark: 'rgba(16, 185, 129, 0.45)',
    textDark: '#6ee7b7',
    hoursPerGrade: { 1: 4, 2: 6, 3: 6 },
  },
  {
    id: 'biologia',
    name: 'Biología',
    shortName: 'Biol.',
    color: '#059669',
    textColor: '#065f46',
    borderColor: '#6ee7b7',
    bgLight: '#ecfdf5',
    bgDark: 'rgba(6, 78, 59, 0.4)',
    borderDark: 'rgba(16, 185, 129, 0.45)',
    textDark: '#6ee7b7',
    hoursPerGrade: { 1: 4, 2: 0, 3: 0 },
  },
  {
    id: 'fisica',
    name: 'Física',
    shortName: 'Física',
    color: '#0d9488',
    textColor: '#115e59',
    borderColor: '#5eead4',
    bgLight: '#f0fdfa',
    bgDark: 'rgba(19, 78, 74, 0.4)',
    borderDark: 'rgba(20, 184, 166, 0.45)',
    textDark: '#5eead4',
    hoursPerGrade: { 1: 0, 2: 6, 3: 0 },
  },
  {
    id: 'quimica',
    name: 'Química',
    shortName: 'Química',
    color: '#047857',
    textColor: '#064e3b',
    borderColor: '#a7f3d0',
    bgLight: '#f0fdf4',
    bgDark: 'rgba(6, 78, 59, 0.4)',
    borderDark: 'rgba(52, 211, 153, 0.45)',
    textDark: '#a7f3d0',
    hoursPerGrade: { 1: 0, 2: 0, 3: 6 },
  },
  {
    id: 'ingles',
    name: 'Inglés',
    shortName: 'Inglés',
    color: '#7c3aed', // Purple
    textColor: '#5b21b6',
    borderColor: '#c4b5fd',
    bgLight: '#f5f3ff',
    bgDark: 'rgba(88, 28, 135, 0.35)',
    borderDark: 'rgba(168, 85, 247, 0.45)',
    textDark: '#d8b4fe',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
  },
  {
    id: 'geografia',
    name: 'Geografía',
    shortName: 'Geog.',
    color: '#d97706', // Amber
    textColor: '#92400e',
    borderColor: '#fcd34d',
    bgLight: '#fffbeb',
    bgDark: 'rgba(120, 53, 15, 0.4)',
    borderDark: 'rgba(245, 158, 11, 0.45)',
    textDark: '#fde68a',
    hoursPerGrade: { 1: 4, 2: 0, 3: 0 },
  },
  {
    id: 'historia',
    name: 'Historia',
    shortName: 'Hist.',
    color: '#b45309', // Brown-Orange
    textColor: '#78350f',
    borderColor: '#fed7aa',
    bgLight: '#fff7ed',
    bgDark: 'rgba(124, 45, 18, 0.4)',
    borderDark: 'rgba(251, 146, 60, 0.45)',
    textDark: '#fed7aa',
    hoursPerGrade: { 1: 2, 2: 4, 3: 4 },
  },
  {
    id: 'fce',
    name: 'Formación Cívica y Ética',
    shortName: 'F.C. y E.',
    color: '#0891b2', // Cyan
    textColor: '#155e75',
    borderColor: '#67e8f9',
    bgLight: '#ecfeff',
    bgDark: 'rgba(22, 78, 99, 0.4)',
    borderDark: 'rgba(6, 182, 212, 0.45)',
    textDark: '#67e8f9',
    hoursPerGrade: { 1: 2, 2: 2, 3: 2 },
  },
  {
    id: 'artes',
    name: 'Artes',
    shortName: 'Artes',
    color: '#db2777', // Pink
    textColor: '#9d174d',
    borderColor: '#fbcfe8',
    bgLight: '#fdf2f8',
    bgDark: 'rgba(131, 24, 67, 0.35)',
    borderDark: 'rgba(236, 72, 153, 0.45)',
    textDark: '#fbcfe8',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
  },
  {
    id: 'tecnologia',
    name: 'Tecnología',
    shortName: 'Tec.',
    color: '#4f46e5', // Indigo
    textColor: '#3730a3',
    borderColor: '#a5b4fc',
    bgLight: '#eef2ff',
    bgDark: 'rgba(49, 46, 129, 0.4)',
    borderDark: 'rgba(99, 102, 241, 0.45)',
    textDark: '#c7d2fe',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
  },
  {
    id: 'educacion_fisica',
    name: 'Educación Física',
    shortName: 'Ed. Fis.',
    color: '#65a30d', // Lime
    textColor: '#3f6212',
    borderColor: '#bef264',
    bgLight: '#f7fee7',
    bgDark: 'rgba(54, 83, 20, 0.4)',
    borderDark: 'rgba(132, 204, 22, 0.45)',
    textDark: '#bef264',
    hoursPerGrade: { 1: 2, 2: 2, 3: 2 },
  },
  {
    id: 'tutoria',
    name: 'Tutoría',
    shortName: 'Tutoría',
    color: '#0f766e', // Teal
    textColor: '#134e4a',
    borderColor: '#99f6e4',
    bgLight: '#ccfbf1',
    bgDark: 'rgba(17, 94, 89, 0.4)',
    borderDark: 'rgba(45, 212, 191, 0.45)',
    textDark: '#99f6e4',
    hoursPerGrade: { 1: 1, 2: 1, 3: 1 },
  },
  {
    id: 'int_c',
    name: 'Integración Curricular',
    shortName: 'Int. C.',
    color: '#475569', // Slate
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
    bgLight: '#f1f5f9',
    bgDark: 'rgba(30, 41, 59, 0.6)',
    borderDark: 'rgba(100, 116, 139, 0.5)',
    textDark: '#cbd5e1',
    hoursPerGrade: { 1: 1, 2: 1, 3: 1 },
  },
];

export const GROUPS: Group[] = [
  // 1st Grade (9 groups: 1ºA to 1ºI)
  { id: '1A', name: '1ºA', grade: 1, section: 'A', advisor: 'KARY', advisorTeacherId: 'DOC-KARY' },
  { id: '1B', name: '1ºB', grade: 1, section: 'B', advisor: 'INDHIRA', advisorTeacherId: 'DOC-INDHIRA' },
  { id: '1C', name: '1ºC', grade: 1, section: 'C', advisor: 'LUIS E.', advisorTeacherId: 'DOC-LUIS-E' },
  { id: '1D', name: '1ºD', grade: 1, section: 'D', advisor: 'KAREN R.', advisorTeacherId: 'DOC-KAREN-R' },
  { id: '1E', name: '1ºE', grade: 1, section: 'E', advisor: 'JESUS S.', advisorTeacherId: 'DOC-JESUS-S' },
  { id: '1F', name: '1ºF', grade: 1, section: 'F', advisor: 'MARCELA', advisorTeacherId: 'DOC-MARCELA' },
  { id: '1G', name: '1ºG', grade: 1, section: 'G', advisor: 'CORAL', advisorTeacherId: 'DOC-CORAL' },
  { id: '1H', name: '1ºH', grade: 1, section: 'H', advisor: 'ANA B.', advisorTeacherId: 'DOC-ANA-B' },
  { id: '1I', name: '1ºI', grade: 1, section: 'I', advisor: 'ROSA M. T.', advisorTeacherId: 'DOC-ROSA-M-T' },

  // 2nd Grade (7 groups: 2ºA to 2ºG)
  { id: '2A', name: '2ºA', grade: 2, section: 'A', advisor: 'SERGIO E.', advisorTeacherId: 'DOC-SERGIO-E' },
  { id: '2B', name: '2ºB', grade: 2, section: 'B', advisor: 'CASTAÑON', advisorTeacherId: 'DOC-CASTANON' },
  { id: '2C', name: '2ºC', grade: 2, section: 'C', advisor: 'JAIME', advisorTeacherId: 'DOC-JAIME' },
  { id: '2D', name: '2ºD', grade: 2, section: 'D', advisor: 'CESAR', advisorTeacherId: 'DOC-CESAR' },
  { id: '2E', name: '2ºE', grade: 2, section: 'E', advisor: 'BRENDA S.', advisorTeacherId: 'DOC-BRENDA-S' },
  { id: '2F', name: '2ºF', grade: 2, section: 'F', advisor: 'YAIR O.', advisorTeacherId: 'DOC-YAIR-O' },
  { id: '2G', name: '2ºG', grade: 2, section: 'G', advisor: 'ROEL', advisorTeacherId: 'DOC-ROEL' },

  // 3rd Grade (8 groups: 3ºA to 3ºH)
  { id: '3A', name: '3ºA', grade: 3, section: 'A', advisor: 'ROCIO', advisorTeacherId: 'DOC-ROCIO' },
  { id: '3B', name: '3ºB', grade: 3, section: 'B', advisor: 'NORMA I.', advisorTeacherId: 'DOC-NORMA-I' },
  { id: '3C', name: '3ºC', grade: 3, section: 'C', advisor: 'OLGA', advisorTeacherId: 'DOC-OLGA' },
  { id: '3D', name: '3ºD', grade: 3, section: 'D', advisor: 'SUSANA', advisorTeacherId: 'DOC-SUSANA' },
  { id: '3E', name: '3ºE', grade: 3, section: 'E', advisor: 'ROSA M. T.', advisorTeacherId: 'DOC-ROSA-M-T' },
  { id: '3F', name: '3ºF', grade: 3, section: 'F', advisor: 'GERARDO', advisorTeacherId: 'DOC-GERARDO' },
  { id: '3G', name: '3ºG', grade: 3, section: 'G', advisor: 'CAMARILLO', advisorTeacherId: 'DOC-CAMARILLO' },
  { id: '3H', name: '3ºH', grade: 3, section: 'H', advisor: 'JORGE', advisorTeacherId: 'DOC-JORGE' },
];

export const INITIAL_ACADEMIC_LOAD: AcademicLoadItem[] = [
  // 1ºA
  {
    groupId: '1A',
    groupName: '1ºA',
    grade: 1,
    advisor: 'KARY',
    subjects: {
      'Español': { teacherName: 'KAREN R.', hours: 5 },
      'Matemáticas': { teacherName: 'MARTHA', hours: 5 },
      'Ciencias': { teacherName: 'INDHIRA', hours: 4 },
      'Inglés': { teacherName: 'KARY', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'ADRIANA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'LUIS E.', hours: 2 },
      'Tutoría': { teacherName: 'MATA', hours: 1 },
      'Integración Curricular': { teacherName: 'GRACIELA J.', hours: 1 },
    },
  },
  // 1ºB
  {
    groupId: '1B',
    groupName: '1ºB',
    grade: 1,
    advisor: 'INDHIRA',
    subjects: {
      'Español': { teacherName: 'KAREN R.', hours: 5 },
      'Matemáticas': { teacherName: 'MARTHA', hours: 5 },
      'Ciencias': { teacherName: 'INDHIRA', hours: 4 },
      'Inglés': { teacherName: 'CORAL', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'OLGA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'LUIS E.', hours: 2 },
      'Tutoría': { teacherName: 'JAIME', hours: 1 },
      'Integración Curricular': { teacherName: 'OLGA', hours: 1 },
    },
  },
  // 1ºC
  {
    groupId: '1C',
    groupName: '1ºC',
    grade: 1,
    advisor: 'LUIS E.',
    subjects: {
      'Español': { teacherName: 'CORAL', hours: 5 },
      'Matemáticas': { teacherName: 'MARTHA', hours: 5 },
      'Ciencias': { teacherName: 'ROMERO', hours: 4 },
      'Inglés': { teacherName: 'ROSA M.', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'OLGA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'LUIS E.', hours: 2 },
      'Tutoría': { teacherName: 'DAVID', hours: 1 },
      'Integración Curricular': { teacherName: 'YAIR O.', hours: 1 },
    },
  },
  // 1ºD
  {
    groupId: '1D',
    groupName: '1ºD',
    grade: 1,
    advisor: 'KAREN',
    subjects: {
      'Español': { teacherName: 'KAREN R.', hours: 5 },
      'Matemáticas': { teacherName: 'MARTHA', hours: 5 },
      'Ciencias': { teacherName: 'ROMERO', hours: 4 },
      'Inglés': { teacherName: 'ROSA M.', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'CORAL', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'LUIS E.', hours: 2 },
      'Tutoría': { teacherName: 'CAMARILLO', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 1ºE
  {
    groupId: '1E',
    groupName: '1ºE',
    grade: 1,
    advisor: 'JESUS S.',
    subjects: {
      'Español': { teacherName: 'KAREN R.', hours: 5 },
      'Matemáticas': { teacherName: 'OLGA', hours: 5 },
      'Ciencias': { teacherName: 'INDHIRA', hours: 4 },
      'Inglés': { teacherName: 'CORAL', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'YAIR O.', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'JESUS S.', hours: 2 },
      'Tutoría': { teacherName: 'KAREN R.', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 1ºF
  {
    groupId: '1F',
    groupName: '1ºF',
    grade: 1,
    advisor: 'MARCELA',
    subjects: {
      'Español': { teacherName: 'KAREN R.', hours: 5 },
      'Matemáticas': { teacherName: 'OLGA', hours: 5 },
      'Ciencias': { teacherName: 'YAIR O.', hours: 4 },
      'Inglés': { teacherName: 'CORAL', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'ADRIANA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'JESUS S.', hours: 2 },
      'Tutoría': { teacherName: 'ADRIANA', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 1ºG
  {
    groupId: '1G',
    groupName: '1ºG',
    grade: 1,
    advisor: 'CORAL',
    subjects: {
      'Español': { teacherName: 'KARY', hours: 5 },
      'Matemáticas': { teacherName: 'ANA B.', hours: 5 },
      'Ciencias': { teacherName: 'JAIME', hours: 4 },
      'Inglés': { teacherName: 'CORAL', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'ADRIANA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'JESUS S.', hours: 2 },
      'Tutoría': { teacherName: 'INDHIRA', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 1ºH
  {
    groupId: '1H',
    groupName: '1ºH',
    grade: 1,
    advisor: 'ANA B.',
    subjects: {
      'Español': { teacherName: 'KARY', hours: 5 },
      'Matemáticas': { teacherName: 'ANA B.', hours: 5 },
      'Ciencias': { teacherName: 'INDHIRA', hours: 4 },
      'Inglés': { teacherName: 'CORAL', hours: 3 },
      'Geografía': { teacherName: 'TANIA', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'OLGA', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'JESUS S.', hours: 2 },
      'Tutoría': { teacherName: 'INDHIRA', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 1ºI
  {
    groupId: '1I',
    groupName: '1ºI',
    grade: 1,
    advisor: 'ROSA M.',
    subjects: {
      'Español': { teacherName: 'CORAL', hours: 5 },
      'Matemáticas': { teacherName: 'ANA B.', hours: 5 },
      'Ciencias': { teacherName: 'INDHIRA', hours: 4 },
      'Inglés': { teacherName: 'ROSA M.', hours: 3 },
      'Geografía': { teacherName: 'KARY', hours: 4 },
      'Formación Cívica y Ética': { teacherName: 'ADRIANA', hours: 2 },
      'Historia': { teacherName: 'MATA', hours: 2 },
      'Artes': { teacherName: 'GRACIELA J.', hours: 3 },
      'Tecnología': { teacherName: 'MARCELA', hours: 3 },
      'Educación Física': { teacherName: 'JESUS S.', hours: 2 },
      'Tutoría': { teacherName: 'OLGA', hours: 1 },
      'Integración Curricular': { teacherName: 'CORAL', hours: 1 },
    },
  },
  // 2ºA
  {
    groupId: '2A',
    groupName: '2ºA',
    grade: 2,
    advisor: 'SERGIO E.',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'OLGA', hours: 5 },
      'Ciencias': { teacherName: 'VALERIA', hours: 6 },
      'Inglés': { teacherName: 'BRENDAS', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'OLGA', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CARLA', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'OLGA', hours: 1 },
    },
  },
  // 2ºB
  {
    groupId: '2B',
    groupName: '2ºB',
    grade: 2,
    advisor: 'CASTAÑON',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'JIOVANA', hours: 5 },
      'Ciencias': { teacherName: 'JAIME', hours: 6 },
      'Inglés': { teacherName: 'BRENDAS', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'MANUEL', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CARLA', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'ERASTO', hours: 1 },
    },
  },
  // 2ºC
  {
    groupId: '2C',
    groupName: '2ºC',
    grade: 2,
    advisor: 'JAIME',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'ROEL', hours: 5 },
      'Ciencias': { teacherName: 'VALERIA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'MANUEL', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CARLA', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'CESAR', hours: 1 },
    },
  },
  // 2ºD
  {
    groupId: '2D',
    groupName: '2ºD',
    grade: 2,
    advisor: 'CESAR',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'ROEL', hours: 5 },
      'Ciencias': { teacherName: 'VALERIA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'MANUEL', hours: 4 },
      'Artes': { teacherName: 'ROEL', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CARLA', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'CESAR', hours: 1 },
    },
  },
  // 2ºE
  {
    groupId: '2E',
    groupName: '2ºE',
    grade: 2,
    advisor: 'BRENDA S.',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'JIOVANA', hours: 5 },
      'Ciencias': { teacherName: 'YAIR O.', hours: 6 },
      'Inglés': { teacherName: 'BRENDAS', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'CESAR', hours: 4 },
      'Artes': { teacherName: 'MIRNA', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CARLA', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'CESAR', hours: 1 },
    },
  },
  // 2ºF
  {
    groupId: '2F',
    groupName: '2ºF',
    grade: 2,
    advisor: 'YAIR O.',
    subjects: {
      'Español': { teacherName: 'SERGIO E.', hours: 5 },
      'Matemáticas': { teacherName: 'JIOVANA', hours: 5 },
      'Ciencias': { teacherName: 'YAIR O.', hours: 6 },
      'Inglés': { teacherName: 'BRENDAS', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'CESAR', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 2ºG
  {
    groupId: '2G',
    groupName: '2ºG',
    grade: 2,
    advisor: 'ROEL',
    subjects: {
      'Español': { teacherName: 'ROSA M T', hours: 5 },
      'Matemáticas': { teacherName: 'ROEL', hours: 5 },
      'Ciencias': { teacherName: 'YAIR O.', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'DAVID', hours: 2 },
      'Historia': { teacherName: 'MIRNA', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'ANA B.', hours: 1 },
    },
  },
  // 3ºA
  {
    groupId: '3A',
    groupName: '3ºA',
    grade: 3,
    advisor: 'ROCIO',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'JIOVANA', hours: 5 },
      'Ciencias': { teacherName: 'JAIME', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'DAVID', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'JIOVANA', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºB
  {
    groupId: '3B',
    groupName: '3ºB',
    grade: 3,
    advisor: 'NORMA I.',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'JIOVANA', hours: 5 },
      'Ciencias': { teacherName: 'OMAR', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'CESAR', hours: 4 },
      'Artes': { teacherName: 'CASTAÑON', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'KAREN R.', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºC
  {
    groupId: '3C',
    groupName: '3ºC',
    grade: 3,
    advisor: 'OLGA',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'SUSANA', hours: 5 },
      'Ciencias': { teacherName: 'OMAR', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'OLGA', hours: 4 },
      'Artes': { teacherName: 'ANA B.', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMAR', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºD
  {
    groupId: '3D',
    groupName: '3ºD',
    grade: 3,
    advisor: 'SUSANA',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'SUSANA', hours: 5 },
      'Ciencias': { teacherName: 'GRACIELA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'GRACIELA J.', hours: 4 },
      'Artes': { teacherName: 'CAMARILLO', hours: 3 },
      'Tecnología': { teacherName: 'NORMA I.', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºE
  {
    groupId: '3E',
    groupName: '3ºE',
    grade: 3,
    advisor: 'ROSA M. T.',
    subjects: {
      'Español': { teacherName: 'ROSA M T', hours: 5 },
      'Matemáticas': { teacherName: 'SUSANA', hours: 5 },
      'Ciencias': { teacherName: 'GRACIELA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'GRACIELA J.', hours: 4 },
      'Artes': { teacherName: 'CAMARILLO', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºF
  {
    groupId: '3F',
    groupName: '3ºF',
    grade: 3,
    advisor: 'GERARDO',
    subjects: {
      'Español': { teacherName: 'ROSA M T', hours: 5 },
      'Matemáticas': { teacherName: 'ROEL', hours: 5 },
      'Ciencias': { teacherName: 'GRACIELA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'JORGE', hours: 4 },
      'Artes': { teacherName: 'OMAR', hours: 3 },
      'Tecnología': { teacherName: 'CASTAÑON', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMEL', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºG
  {
    groupId: '3G',
    groupName: '3ºG',
    grade: 3,
    advisor: 'CAMARILLO',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'ROEL', hours: 5 },
      'Ciencias': { teacherName: 'GRACIELA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'JORGE', hours: 4 },
      'Artes': { teacherName: 'JIOVANA', hours: 3 },
      'Tecnología': { teacherName: 'CAROLINA', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'NORMA I.', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
  // 3ºH
  {
    groupId: '3H',
    groupName: '3ºH',
    grade: 3,
    advisor: 'JORGE',
    subjects: {
      'Español': { teacherName: 'ROCIO', hours: 5 },
      'Matemáticas': { teacherName: 'SUSANA', hours: 5 },
      'Ciencias': { teacherName: 'GRACIELA', hours: 6 },
      'Inglés': { teacherName: 'GERARDO', hours: 3 },
      'Formación Cívica y Ética': { teacherName: 'ERASTO', hours: 2 },
      'Historia': { teacherName: 'JORGE', hours: 4 },
      'Artes': { teacherName: 'ROEL', hours: 3 },
      'Tecnología': { teacherName: 'CAROLINA', hours: 3 },
      'Educación Física': { teacherName: 'CESAR', hours: 2 },
      'Tutoría': { teacherName: 'OMAR', hours: 1 },
      'Integración Curricular': { teacherName: 'LUIS E.', hours: 1 },
    },
  },
];

// Raw CSV text provided directly in the prompt
export const RAW_SCHEDULE_CSV = `Maestro,Materia,Lunes 1,Lunes 2,Lunes 3,Lunes 4,Lunes 5,Lunes 6,Lunes 7,Martes 1,Martes 2,Martes 3,Martes 4,Martes 5,Martes 6,Martes 7,Miércoles 1,Miércoles 2,Miércoles 3,Miércoles 4,Miércoles 5,Miércoles 6,Miércoles 7,Jueves 1,Jueves 2,Jueves 3,Jueves 4,Jueves 5,Jueves 6,Jueves 7,Viernes 1,Viernes 2,Viernes 3,Viernes 4,Viernes 5,Viernes 6,Viernes 7
Karen A,Español,1A - Español,1F - Español,1E - Español,1D - Español,3B - Español,1B - Español,1E - Español,,,,,,,,,1D - Español,1E - Español,1A - Español,,1B - Español,1A - Español,1F - Español,1D - Español,1A - Español,1E - Español,,1B - Español,1F - Español,1E - Español,1F - Español,1B - Español,1A - Español,1D - Español,1E - Español,,
Adri,Artes,,1G - Artes,1F - Artes,1A - Artes,,,,1F - Artes,1E - Artes,1F - Artes,1H - Artes,1I - Artes,1A - Artes,,1F - Artes,1D - Artes,1G - Artes,,1B - Artes,1H - Artes,1A - Artes,1F - Artes,,1G - Artes,1C - Artes,1B - Artes,,1G - Artes,1D - Artes,1E - Artes,1C - Artes,,,,,
Sergio E.,Español,2E - Español,2C - Español,2B - Español,,2D - Español,2A - Español,2F - Español,2A - Español,2D - Español,2B - Español,2F - Español,,,,2C - Español,2E - Español,2C - Español,2D - Español,2B - Español,,2F - Español,2A - Español,2E - Español,2D - Español,,2C - Español,2F - Español,2E - Español,2D - Español,2B - Español,2A - Español,,,,,
Roel,Matemáticas,3F - Matemáticas,3G - Matemáticas,2C - Matemáticas,2D - Matemáticas,,2D - Matemáticas,2G - Matemáticas,2C - Matemáticas,3G - Matemáticas,,3F - Matemáticas,3H - Matemáticas,2G - Matemáticas,,2D - Matemáticas,2C - Matemáticas,2D - Matemáticas,,3G - Matemáticas,,,3F - Matemáticas,2D - Matemáticas,3G - Matemáticas,,3H - Matemáticas,2D - Matemáticas,,2C - Matemáticas,3G - Matemáticas,3F - Matemáticas,3H - Matemáticas,2D - Matemáticas,2G - Matemáticas,,
Camarillo,Tutoría,1D - Tutoría,3D - Tutoría,3D - Tutoría,3E - Tutoría,,,,3D - Tutoría,3E - Tutoría,3E - Tutoría,,,,,,,,,,,,,,,,,,,,,,,,,,
ROMERO,Biología,,,,,,,,1D - Biología,1C - Biología,1C - Biología,1D - Biología,,,,1C - Biología,1D - Biología,1D - Biología,1C - Biología,,,,,,,,,,,,,,,,,,
Indhira,Biología,,,1I - Biología,1B - Biología,1H - Biología,1A - Biología,1G - Biología,,,1I - Biología,1B - Biología,1H - Biología,1E - Biología,,,,,1A - Biología,1B - Biología,1E - Biología,,,1E - Biología,1H - Biología,1I - Biología,1A - Biología,1B - Biología,,1H - Biología,1I - Biología,1H - Biología,1A - Biología,1E - Biología,,,
Valeria,Física,2A - Física,,,,2C - Física,2D - Física,,,,,,2A - Física,2D - Física,2A - Física,2C - Física,,2D - Física,2C - Física,,,,2A - Física,,,2A - Física,2A - Física,2D - Física,2C - Física,,,,,,,,
Graciela,Química,3H - Química,,,3D - Química,3E - Química,3F - Química,3G - Química,3H - Química,3F - Química,3G - Química,3E - Química,3F - Química,3G - Química,3D - Química,3E - Química,3H - Química,3G - Química,3D - Química,3E - Química,3H - Química,,3F - Química,,3D - Química,3H - Química,3F - Química,3E - Química,3D - Química,,,,3G - Química,3H - Química,,,
Omar,Artes,2F - Artes,3F - Artes,2G - Artes,3B - Artes,3C - Artes,2B - Artes,2C - Artes,3F - Artes,2B - Artes,2A - Artes,3C - Artes,3B - Artes,2F - Artes,3H - Artes,3C - Artes,3B - Artes,2B - Artes,2A - Artes,2F - Artes,3A - Artes,3B - Artes,2C - Artes,2A - Artes,3C - Artes,2G - Artes,3A - Artes,,3C - Artes,3A - Artes,2G - Artes,3B - Artes,3F - Artes,,,,
Gerardo,Inglés,2D - Inglés,3E - Inglés,3E - Inglés,2G - Inglés,2C - Inglés,3A - Inglés,3F - Inglés,3B - Inglés,3A - Inglés,3H - Inglés,3G - Inglés,2D - Inglés,2C - Inglés,2E - Inglés,3E - Inglés,3H - Inglés,3G - Inglés,3D - Inglés,,,,2D - Inglés,3B - Inglés,3G - Inglés,3A - Inglés,2G - Inglés,3D - Inglés,2C - Inglés,3E - Inglés,3F - Inglés,3C - Inglés,3H - Inglés,,,,
Marcela,Tecnología,,1I - Tecnología,1G - Tecnología,,1C - Tecnología,1H - Tecnología,1A - Tecnología,1G - Tecnología,1B - Tecnología,1E - Tecnología,1A - Tecnología,1F - Tecnología,1H - Tecnología,,1F - Tecnología,,1H - Tecnología,,1E - Tecnología,1D - Tecnología,,1B - Tecnología,1I - Tecnología,1A - Tecnología,1C - Tecnología,1D - Tecnología,,,1I - Tecnología,1A - Tecnología,1D - Tecnología,1C - Tecnología,1B - Tecnología,1G - Tecnología,,
Tania,Geografía,1F - Geografía,1A - Geografía,1C - Geografía,1E - Geografía,1G - Geografía,1D - Geografía,,1E - Geografía,1D - Geografía,1H - Geografía,1B - Geografía,1F - Geografía,1G - Geografía,,1B - Geografía,1B - Geografía,1F - Geografía,1E - Geografía,1H - Geografía,1G - Geografía,1A - Geografía,1C - Geografía,1D - Geografía,,1H - Geografía,1C - Geografía,1E - Geografía,,1B - Geografía,1F - Geografía,,1A - Geografía,,,,
David,Historia,3A - Historia,2E - Historia,2B - Historia,2A - Historia,2F - Historia,3A - Historia,,2B - Historia,,2D - Historia,2C - Historia,2G - Historia,3A - Historia,1C - Historia,2G - Historia,3A - Historia,2F - Historia,2A - Historia,2D - Historia,2E - Historia,2C - Historia,,,,,,,,,,,,,,,
Erasto,Formación Cívica y Ética,3E - Formación Cívica y Ética,3E - Formación Cívica y Ética,3F - Formación Cívica y Ética,3C - Formación Cívica y Ética,3G - Formación Cívica y Ética,3H - Formación Cívica y Ética,,,,,,,,,,3B - Formación Cívica y Ética,3B - Formación Cívica y Ética,3D - Formación Cívica y Ética,3H - Formación Cívica y Ética,,,3C - Formación Cívica y Ética,3C - Formación Cívica y Ética,3A - Formación Cívica y Ética,,3B - Formación Cívica y Ética,,3A - Formación Cívica y Ética,3F - Formación Cívica y Ética,3A - Formación Cívica y Ética,2B - Formación Cívica y Ética,3D - Formación Cívica y Ética,,,,
Olga,Artes,1H - Artes,2A - Artes,3C - Artes,2A - Artes,1E - Artes,1F - Artes,1B - Artes,1H - Artes,3C - Artes,2A - Artes,1E - Artes,1B - Artes,1F - Artes,2A - Artes,3C - Artes,1E - Artes,1F - Artes,1H - Artes,2A - Artes,,,1F - Artes,1C - Artes,1E - Artes,2A - Artes,2A - Artes,1B - Artes,,,,,,,,,
Mata,Historia,1E - Historia,1D - Historia,1H - Historia,1F - Historia,1B - Historia,1C - Historia,1A - Historia,1A - Historia,1B - Historia,1F - Historia,1H - Historia,1I - Historia,1G - Historia,1D - Historia,1G - Historia,1A - Historia,1E - Historia,1I - Historia,1C - Historia,,,,,,,,,,,,,,,,,
Myrna,Historia,,,,,,,,2G - Historia,2G - Historia,2E - Historia,2E - Historia,,,,,,,,,,,,2G - Historia,2G - Historia,2E - Historia,2E - Historia,,,,,,,,,,
Jovana,Matemáticas,2B - Matemáticas,2F - Matemáticas,3A - Matemáticas,3G - Matemáticas,,3B - Matemáticas,2E - Matemáticas,3G - Matemáticas,2E - Matemáticas,3A - Matemáticas,2F - Matemáticas,3B - Matemáticas,3G - Matemáticas,2F - Matemáticas,,2A - Matemáticas,2E - Matemáticas,3B - Matemáticas,,3B - Matemáticas,2B - Matemáticas,3A - Matemáticas,2F - Matemáticas,,3B - Matemáticas,2E - Matemáticas,2B - Matemáticas,,,,,,,,,
Cesar,Historia,3B - Historia,3B - Historia,2F - Historia,2F - Historia,2E - Historia,2G - Historia,3D - Historia,2F - Historia,3B - Historia,2C - Historia,3H - Historia,,,,3C - Historia,3E - Historia,2D - Historia,2E - Historia,2G - Historia,3B - Historia,3F - Historia,3F - Historia,3A - Historia,2E - Historia,2F - Historia,3C - Historia,3D - Historia,3E - Historia,3H - Historia,2F - Historia,3B - Historia,3A - Historia,2E - Historia,,,
Omel,Tutoría,,3D - Tutoría,2B - Tutoría,2A - Tutoría,2C - Tutoría,2G - Tutoría,,,,,,,,,,,,,,,,2F - Tutoría,3F - Tutoría,2D - Tutoría,2E - Tutoría,3E - Tutoría,,,,,,,,,,
Carolina,Tecnología,,,,,,,,,,,,,,,,,,3H - Tecnología,3G - Tecnología,,,,,,,,,,,,3G - Tecnología,3H - Tecnología,,,,
Manuel A.,Historia,2C - Historia,,2D - Historia,,,3C - Historia,2B - Historia,,,,,,,,,,,,,,,3C - Historia,2F - Historia,2C - Historia,2B - Historia,2D - Historia,3C - Historia,2B - Historia,,,,2D - Historia,2G - Historia,,,
CARLA,Artes,,,,,,,,,,2E - Artes,,,2D - Artes,2C - Artes,2B - Artes,2A - Artes,2E - Artes,,,2C - Artes,2B - Artes,2D - Artes,2A - Artes,,,,,,,,,,,,,
JORGE,Historia,,,,3F - Historia,3G - Historia,3H - Historia,,,,,,,,,,,,,,,,,,3H - Historia,3H - Historia,3G - Historia,3F - Historia,3F - Historia,,3F - Historia,3G - Historia,3H - Historia,,,,
SUSANA,Matemáticas,,,3H - Matemáticas,3E - Matemáticas,3C - Matemáticas,3C - Matemáticas,3H - Matemáticas,3D - Matemáticas,,,,3C - Matemáticas,3E - Matemáticas,3H - Matemáticas,,,,,,,,3D - Matemáticas,3D - Matemáticas,3E - Matemáticas,,,,,3D - Matemáticas,,3H - Matemáticas,3E - Matemáticas,3C - Matemáticas,,,
CASTAÑON,Tecnología,,2D - Tecnología,2E - Tecnología,,,,3E - Tecnología,,,3B - Tecnología,,,,,2B - Tecnología,3F - Tecnología,,3F - Tecnología,2E - Tecnología,,,2C - Tecnología,2B - Tecnología,,,3B - Tecnología,,2D - Tecnología,2C - Tecnología,3E - Tecnología,,2D - Tecnología,3F - Tecnología,2C - Tecnología,,
NORMA I,Tecnología,,2G - Tecnología,3B - Tecnología,,2F - Tecnología,,2A - Tecnología,,3D - Tecnología,2F - Tecnología,,,2A - Tecnología,3C - Tecnología,3A - Tecnología,,3D - Tecnología,2G - Tecnología,,3C - Tecnología,3A - Tecnología,2F - Tecnología,,,3B - Tecnología,3A - Tecnología,2G - Tecnología,,3D - Tecnología,,3G - Tecnología,,3B - Tecnología,3C - Tecnología,2A - Tecnología,
JAIME,Ciencias,1G - Ciencias,3A - Ciencias,1B - Ciencias,3A - Ciencias,2B - Ciencias,,,,1G - Ciencias,,,2B - Ciencias,3A - Ciencias,,,,2B - Ciencias,2B - Ciencias,3A - Ciencias,1G - Ciencias,3A - Ciencias,,,,,,,,,1G - Ciencias,3A - Ciencias,2B - Ciencias,,2B - Ciencias,,
KARY,Inglés,1I - Inglés,1I - Inglés,,1G - Inglés,1A - Inglés,,,,1I - Inglés,1H - Inglés,1G - Inglés,1A - Inglés,1G - Inglés,,,1H - Inglés,1I - Inglés,1H - Inglés,,,,,,,,,,,,1A - Inglés,1H - Inglés,,1G - Inglés,,,
Martha,Matemáticas,1B - Matemáticas,1C - Matemáticas,1A - Matemáticas,1C - Matemáticas,1D - Matemáticas,,,,1B - Matemáticas,1A - Matemáticas,1C - Matemáticas,1D - Matemáticas,,,,1A - Matemáticas,1C - Matemáticas,1B - Matemáticas,,1D - Matemáticas,,,1B - Matemáticas,1A - Matemáticas,1D - Matemáticas,1C - Matemáticas,,,,,,,,,,
Brenda sinai,Inglés,,,,,,,,,,,,,,,,,,,,,,,2A - Inglés,2E - Inglés,2B - Inglés,,,2F - Inglés,2A - Inglés,2B - Inglés,2E - Inglés,,2A - Inglés,2F - Inglés,2E - Inglés,
Coral,Inglés,,,,1H - Inglés,1I - Inglés,1I - Inglés,1C - Inglés,,,1E - Inglés,,1G - Inglés,1C - Inglés,1D - Inglés,1B - Inglés,1E - Inglés,1G - Inglés,1I - Inglés,1F - Inglés,,1C - Inglés,1B - Inglés,1H - Inglés,,1C - Inglés,1B - Inglés,1F - Inglés,1D - Inglés,1G - Inglés,,1H - Inglés,1D - Inglés,1C - Inglés,1E - Inglés,1I - Inglés,
Rosa,Inglés,1C - Inglés,,1D - Inglés,1I - Inglés,,,,1C - Inglés,1I - Inglés,1D - Inglés,,,,,,1I - Inglés,,1D - Inglés,,,,,,,,,,,,,,,,,,
Ana B,Español,,,,,,,,,,,,,,,,,,1H - Español,1G - Español,,1I - Español,1H - Español,1I - Español,1H - Español,1G - Español,1I - Español,,,,1G - Español,,1H - Español,,,,
Rocio,Español,3C - Español,,3G - Español,3H - Español,3A - Español,3D - Español,,3A - Español,3C - Español,,,3B - Español,3D - Español,3G - Español,3A - Español,,3C - Español,3H - Español,3D - Español,3G - Español,3H - Español,,,,,,,,,,3B - Español,,,3H - Español,3A - Español,3C - Español,
Rosa M T,Español,,,,,,,,3E - Español,,3F - Español,2G - Español,,2G - Español,3F - Español,3F - Español,2G - Español,3E - Español,2G - Español,,3F - Español,3E - Español,,,3E - Español,,,,,3F - Español,3E - Español,2G - Español,,,,,
Graciela Y,Química,,,,,,,,,,,,3D - Química,3E - Química,1A - Química,1I - Química,,,,3E - Química,3D - Química,3D - Química,1I - Química,,,,,,,,,,3E - Química,3D - Química,1I - Química,3E - Química,
AYRTON J,Educación Física,,,,,,,,,,,,,,,,,,,,,,1G - Educación Física,1I - Educación Física,,,1H - Educación Física,1E - Educación Física,1F - Educación Física,1I - Educación Física,,1G - Educación Física,1F - Educación Física,1E - Educación Física,1H - Educación Física,,
LUIS E,Educación Física,,1B - Educación Física,,3F - Educación Física,3H - Educación Física,1E - Educación Física,1D - Educación Física,,,,,,,,,,,,,,,,1C - Educación Física,1F - Educación Física,3G - Educación Física,1G - Educación Física,1H - Educación Física,1A - Educación Física,1D - Educación Física,1B - Educación Física,,,1A - Educación Física,1C - Educación Física,1D - Educación Física,1D - Educación Física,
YAIR,Educación Física,2G - Educación Física,1E - Educación Física,,2E - Educación Física,1F - Educación Física,2E - Educación Física,,1F - Educación Física,2F - Educación Física,2G - Educación Física,,2E - Educación Física,1E - Educación Física,2F - Educación Física,2F - Educación Física,2E - Educación Física,,,2F - Educación Física,2G - Educación Física,1F - Educación Física,,1E - Educación Física,1F - Educación Física,2F - Educación Física,,2E - Educación Física,2G - Educación Física,,,2G - Educación Física,2G - Educación Física,1C - Educación Física,2E - Educación Física,2F - Educación Física,`;

// Function to parse the raw CSV into ScheduleEntry objects
export function parseInitialEntriesFromCSV(csvText: string = RAW_SCHEDULE_CSV): ScheduleEntry[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  // Headers are: Maestro, Materia, Lunes 1, Lunes 2, ..., Viernes 7
  const slotHeaders = headers.slice(2);

  const slotDayMap: { day: DayOfWeek; slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 }[] = [];
  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  for (const day of days) {
    for (let s = 1; s <= 7; s++) {
      slotDayMap.push({ day, slot: s as 1 | 2 | 3 | 4 | 5 | 6 | 7 });
    }
  }

  const entries: ScheduleEntry[] = [];
  let idCounter = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(',').map((c) => c.trim());
    const teacherName = cols[0];
    const defaultSubject = cols[1] || '';

    if (!teacherName) continue;

    for (let j = 0; j < 35 && j < slotDayMap.length; j++) {
      const cellValue = cols[j + 2] || '';
      if (!cellValue) continue;

      // cellValue is formatted like "1A - Español", "2F - Tutoría", "3B", etc.
      let groupId = '';
      let subject = defaultSubject;

      if (cellValue.includes('-')) {
        const parts = cellValue.split('-').map((p) => p.trim());
        groupId = parts[0].replace('º', '').trim();
        if (parts[1]) subject = parts[1];
      } else {
        groupId = cellValue.replace('º', '').trim();
      }

      if (groupId) {
        const canonicalTeacher = standardizeTeacherName(teacherName);
        const canonicalTeacherId = getCanonicalTeacherId(canonicalTeacher);
        entries.push({
          id: `entry-${idCounter++}`,
          day: slotDayMap[j].day,
          slot: slotDayMap[j].slot,
          groupId: groupId,
          teacherName: canonicalTeacher,
          teacherId: canonicalTeacherId,
          subject: subject || defaultSubject || 'Asignatura',
        });
      }
    }
  }

  return entries;
}
