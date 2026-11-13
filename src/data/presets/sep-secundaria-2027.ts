import type { CurriculumSubjectRule } from '../../core/models/schedule.types';
import type { GradeLevel } from '../../types';

/**
 * Mapa Curricular Oficial SEP — Secundaria General (Plan 2022 / Ciclo 2027-2028)
 * Exactamente 35 periodos semanales por grupo distribuidos en los 5 Campos Formativos.
 */
export const SEP_SECUNDARIA_2027_CURRICULUM: CurriculumSubjectRule[] = [
  // Campo Formativo: Lenguajes (11 hrs)
  {
    subjectId: 'espanol',
    name: 'Español',
    shortName: 'ESP',
    campoFormativo: 'Lenguajes',
    hoursPerGrade: { 1: 5, 2: 5, 3: 5 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'ingles',
    name: 'Inglés',
    shortName: 'ING',
    campoFormativo: 'Lenguajes',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'artes',
    name: 'Artes',
    shortName: 'ART',
    campoFormativo: 'Lenguajes',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
    maxConsecutivePerDay: 2,
  },

  // Campo Formativo: Saberes y Pensamiento Científico (9 hrs en 1º, 11 hrs en 2º y 3º)
  {
    subjectId: 'matematicas',
    name: 'Matemáticas',
    shortName: 'MAT',
    campoFormativo: 'Saberes y Pensamiento Científico',
    hoursPerGrade: { 1: 5, 2: 5, 3: 5 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'biologia',
    name: 'Ciencias I (Biología)',
    shortName: 'BIO',
    campoFormativo: 'Saberes y Pensamiento Científico',
    hoursPerGrade: { 1: 4, 2: 0, 3: 0 },
    requiresLabOrWorkshop: true,
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'fisica',
    name: 'Ciencias II (Física)',
    shortName: 'FIS',
    campoFormativo: 'Saberes y Pensamiento Científico',
    hoursPerGrade: { 1: 0, 2: 6, 3: 0 },
    requiresLabOrWorkshop: true,
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'quimica',
    name: 'Ciencias III (Química)',
    shortName: 'QUI',
    campoFormativo: 'Saberes y Pensamiento Científico',
    hoursPerGrade: { 1: 0, 2: 0, 3: 6 },
    requiresLabOrWorkshop: true,
    maxConsecutivePerDay: 2,
  },

  // Campo Formativo: Ética, Naturaleza y Sociedades (8 hrs en 1º, 6 hrs en 2º y 3º)
  {
    subjectId: 'geografia',
    name: 'Geografía',
    shortName: 'GEO',
    campoFormativo: 'Ética, Naturaleza y Sociedades',
    hoursPerGrade: { 1: 4, 2: 0, 3: 0 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'historia',
    name: 'Historia',
    shortName: 'HIS',
    campoFormativo: 'Ética, Naturaleza y Sociedades',
    hoursPerGrade: { 1: 2, 2: 4, 3: 4 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'fce',
    name: 'Formación Cívica y Ética',
    shortName: 'FCE',
    campoFormativo: 'Ética, Naturaleza y Sociedades',
    hoursPerGrade: { 1: 2, 2: 2, 3: 2 },
    maxConsecutivePerDay: 1,
  },

  // Campo Formativo: De lo Humano y lo Comunitario (6 hrs)
  {
    subjectId: 'tecnologia',
    name: 'Tecnología',
    shortName: 'TEC',
    campoFormativo: 'De lo Humano y lo Comunitario',
    hoursPerGrade: { 1: 3, 2: 3, 3: 3 },
    requiresLabOrWorkshop: true,
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'educacion_fisica',
    name: 'Educación Física',
    shortName: 'EDF',
    campoFormativo: 'De lo Humano y lo Comunitario',
    hoursPerGrade: { 1: 2, 2: 2, 3: 2 },
    maxConsecutivePerDay: 2,
  },
  {
    subjectId: 'tutoria',
    name: 'Tutoría / Educación Socioemocional',
    shortName: 'TUT',
    campoFormativo: 'De lo Humano y lo Comunitario',
    hoursPerGrade: { 1: 1, 2: 1, 3: 1 },
    maxConsecutivePerDay: 1,
  },

  // Integración Curricular (1 hr)
  {
    subjectId: 'int_c',
    name: 'Integración Curricular',
    shortName: 'INT',
    campoFormativo: 'Integración Curricular',
    hoursPerGrade: { 1: 1, 2: 1, 3: 1 },
    maxConsecutivePerDay: 1,
  },
];

export const WEEKLY_PERIODS_PER_GROUP = 35;

export function getCurriculumTotalForGrade(grade: GradeLevel): number {
  return SEP_SECUNDARIA_2027_CURRICULUM.reduce(
    (sum, item) => sum + (item.hoursPerGrade[grade] || 0),
    0
  );
}
