import {
  DutyAssignment,
  SubstitutionAssignment,
  DutyZone,
  DayOfWeek,
  TimeSlotId,
  StaggeredBreakSegmentId,
  ScheduleEntry,
  AcademicLoadItem,
} from '../types';
import { getTeacherByNameOrAlias } from '../data/teacherCatalog';
import {
  saveDutiesToIndexedDB,
  saveSubstitutionsToIndexedDB,
  loadDutiesFromIndexedDB,
  loadSubstitutionsFromIndexedDB,
} from './indexedDB';

const DUTY_STORAGE_KEY = 'sec129_duty_assignments';
const SUBSTITUTION_STORAGE_KEY = 'sec129_substitution_assignments';

export const STANDARD_SPECIALTY_FILTERS = [
  'Todas las Especialidades',
  'Español',
  'Matemáticas',
  'Ciencias',
  'Inglés',
  'Historia',
  'Geografía',
  'Formación Cívica y Ética',
  'Educación Física',
  'Artes',
  'Tecnología',
  'Tutoría / Vida Saludable',
] as const;

export const DUTY_ZONES: { zone: DutyZone; icon: string; description: string }[] = [
  {
    zone: 'Patio Central',
    icon: '🏛️',
    description: 'Vigilancia del área central cívica y tránsito principal de alumnos',
  },
  {
    zone: 'Canchas Deportivas',
    icon: '⚽',
    description: 'Supervisión de actividades físicas, canchas de básquetbol y fútbol',
  },
  {
    zone: 'Portón y Acceso Principal',
    icon: '🚪',
    description: 'Control de accesos exteriores, portón escolar y perímetro de seguridad',
  },
  {
    zone: 'Pasillos y Sanitarios',
    icon: '🚻',
    description: 'Supervisión de módulos sanitarios, pasillos de planta alta y baja',
  },
  {
    zone: 'Cafetería / Comedor',
    icon: '🥪',
    description: 'Supervisión de filas de alimentos, mesas de receso y orden de consumo',
  },
  {
    zone: 'Biblioteca / Aulas Exteriores',
    icon: '📚',
    description: 'Zona de biblioteca escolar, talleres y áreas verdes perimetrales',
  },
  {
    zone: 'Otra Zona',
    icon: '📍',
    description: 'Ubicación o comisión específica asignada por la Dirección',
  },
];

export const SUBSTITUTION_REASONS = [
  'Incapacidad médica',
  'Comisión oficial',
  'Permiso económico',
  'Guardia de dirección / prefectura',
  'Asunto sindical',
  'Ausencia imprevista',
  'Otro',
] as const;

export const loadDutyAssignments = (): DutyAssignment[] => {
  try {
    const raw = localStorage.getItem(DUTY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to empty array
  }
  return [];
};

export const saveDutyAssignments = (assignments: DutyAssignment[]): void => {
  try {
    localStorage.setItem(DUTY_STORAGE_KEY, JSON.stringify(assignments));
  } catch (err) {
    console.error('Error saving duty assignments:', err);
  }
  saveDutiesToIndexedDB(assignments).catch((err) => {
    console.warn('Error saving duties to IndexedDB:', err);
  });
};

export const loadSubstitutionAssignments = (): SubstitutionAssignment[] => {
  try {
    const raw = localStorage.getItem(SUBSTITUTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to empty array
  }
  return [];
};

export const saveSubstitutionAssignments = (assignments: SubstitutionAssignment[]): void => {
  try {
    localStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify(assignments));
  } catch (err) {
    console.error('Error saving substitution assignments:', err);
  }
  saveSubstitutionsToIndexedDB(assignments).catch((err) => {
    console.warn('Error saving substitutions to IndexedDB:', err);
  });
};

/**
 * Returns the primary specialty / subject taught by a teacher,
 * consulting the standardized catalog first, then schedule entries, then academic loads.
 */
export const getTeacherSpecialty = (
  teacherName: string,
  entries: ScheduleEntry[] = [],
  academicLoads: AcademicLoadItem[] = []
): string => {
  const catalogTeacher = getTeacherByNameOrAlias(teacherName);
  if (catalogTeacher?.mainSubject) {
    return catalogTeacher.mainSubject;
  }

  // Check schedule entries
  const entry = entries.find(
    (e) => e.teacherName.toLowerCase() === teacherName.toLowerCase() && e.subject
  );
  if (entry?.subject) {
    return entry.subject;
  }

  // Check academic loads
  for (const load of academicLoads) {
    for (const [subj, data] of Object.entries(load.subjects)) {
      if (data.teacherName && data.teacherName.toLowerCase() === teacherName.toLowerCase()) {
        return subj;
      }
    }
  }

  return 'Docente General';
};

/**
 * Matches a teacher's subject/specialty with the active filter.
 */
export const matchesSpecialtyFilter = (
  teacherSpecialty: string,
  selectedFilter: string
): boolean => {
  if (!selectedFilter || selectedFilter === 'Todas las Especialidades') return true;

  const specLower = teacherSpecialty.toLowerCase();
  const filterLower = selectedFilter.toLowerCase();

  if (filterLower === 'ciencias') {
    return (
      specLower.includes('ciencia') ||
      specLower.includes('biolog') ||
      specLower.includes('físic') ||
      specLower.includes('químic')
    );
  }

  if (filterLower === 'español') {
    return specLower.includes('español') || specLower.includes('lengua');
  }

  if (filterLower === 'matemáticas') {
    return specLower.includes('matemátic') || specLower.includes('mate');
  }

  if (filterLower === 'inglés') {
    return specLower.includes('ingl') || specLower.includes('english');
  }

  if (filterLower === 'formación cívica y ética') {
    return specLower.includes('cívic') || specLower.includes('ética') || specLower.includes('fce');
  }

  if (filterLower === 'educación física') {
    return specLower.includes('física') || specLower.includes('ed. física') || specLower.includes('deporte');
  }

  if (filterLower === 'artes') {
    return specLower.includes('arte') || specLower.includes('músic') || specLower.includes('danza') || specLower.includes('teatro');
  }

  if (filterLower === 'tecnología') {
    return specLower.includes('tecnolog') || specLower.includes('taller') || specLower.includes('informátic');
  }

  if (filterLower === 'historia') {
    return specLower.includes('historia');
  }

  if (filterLower === 'geografía') {
    return specLower.includes('geograf');
  }

  if (filterLower.includes('tutoría') || filterLower.includes('saludable')) {
    return specLower.includes('tutor') || specLower.includes('vida') || specLower.includes('salud');
  }

  return specLower.includes(filterLower);
};
