import { AcademicLoadItem, Group, ScheduleEntry } from '../types';
import {
  standardizeTeacherName,
  getCanonicalTeacherId,
  isTeacherActive,
  TEACHER_CATALOG,
} from '../data/teacherCatalog';
import { getSubjectConfig, solveTeacherOverlaps, normalizeName } from './scheduler';

export interface DataCleansingResult {
  cleanedEntries: ScheduleEntry[];
  cleanedLoads: AcademicLoadItem[];
  resolvedOverlapsCount: number;
  deduplicatedTeachersCount: number;
  activeTeachersCount: number;
  inactiveTeachers: string[];
  auditLog: string[];
}

/**
 * High-Priority Data Cleansing & Validation Routine:
 * 1. Standardizes teacher formatting variations:
 *    - Merges "BRENDAS", "Brenda sinai" into canonical "BRENDA S."
 *    - Consolidates the 3 variations of ROSA M. ("ROSA M.", "ROSA M T", "ROSA M. T.", "Rosa") into "ROSA M. T."
 *    - Consolidates "KAREN" advisor into "KAREN R."
 *    - Standardizes case variations (e.g. "Adri", "Ana B", "Luis E", "Manuel A.", "Myrna")
 * 2. Assigns strict Unique IDs (teacherId, payrollId/RFC, subjectId) preventing mismatch.
 * 3. Consolidates multi-subject workloads under the unified teacher.
 * 4. Automatically detects and resolves newly emerging teacher overlaps resulting from consolidation (e.g. Rosa M. T.).
 * 5. Applies calculation exclusion rules for 0-hour orphan records.
 */
export function cleanseAndStandardizeScheduleData(
  entries: ScheduleEntry[],
  loads: AcademicLoadItem[],
  groups: Group[]
): DataCleansingResult {
  const auditLog: string[] = [];
  let deduplicatedCount = 0;

  // Track raw names observed to count deduplication
  const rawNamesSeen = new Set<string>();

  // 1. Clean Academic Loads
  const cleanedLoads: AcademicLoadItem[] = loads.map((load) => {
    const cleanLoad: AcademicLoadItem = {
      ...load,
      advisor: load.advisor ? standardizeTeacherName(load.advisor) : '',
      advisorTeacherId: load.advisor ? getCanonicalTeacherId(load.advisor) : undefined,
      subjects: {},
    };

    if (load.advisor) {
      rawNamesSeen.add(load.advisor.trim());
      if (load.advisor.trim() !== cleanLoad.advisor) {
        deduplicatedCount++;
        auditLog.push(
          `Asesor de ${load.groupId}: '${load.advisor}' estandarizado a '${cleanLoad.advisor}' (${cleanLoad.advisorTeacherId})`
        );
      }
    }

    if (load.subjects) {
      Object.entries(load.subjects).forEach(([subjName, subjVal]) => {
        if (!subjVal || !subjVal.teacherName) return;
        rawNamesSeen.add(subjVal.teacherName.trim());
        const canonicalName = standardizeTeacherName(subjVal.teacherName);
        const canonicalTeacherId = getCanonicalTeacherId(canonicalName);
        const subjectConfig = getSubjectConfig(subjName);
        const canonicalSubjectId = subjectConfig?.id || subjName.toLowerCase().replace(/\s+/g, '_');

        if (subjVal.teacherName.trim() !== canonicalName) {
          deduplicatedCount++;
          auditLog.push(
            `Carga Grupo ${load.groupId} [${subjName}]: '${subjVal.teacherName}' unificado con '${canonicalName}' (${canonicalTeacherId})`
          );
        }

        cleanLoad.subjects[subjName] = {
          ...subjVal,
          teacherName: canonicalName,
          teacherId: canonicalTeacherId,
          subjectId: canonicalSubjectId,
        };
      });
    }

    return cleanLoad;
  });

  // 2. Clean Schedule Entries
  const cleanedEntriesDraft: ScheduleEntry[] = entries.map((entry) => {
    if (!entry.teacherName || !entry.teacherName.trim()) return entry;

    rawNamesSeen.add(entry.teacherName.trim());
    const canonicalName = standardizeTeacherName(entry.teacherName);
    const canonicalTeacherId = getCanonicalTeacherId(canonicalName);
    const subjectConfig = getSubjectConfig(entry.subject);
    const canonicalSubjectId = subjectConfig?.id || entry.subject?.toLowerCase().replace(/\s+/g, '_');

    if (entry.teacherName.trim() !== canonicalName) {
      deduplicatedCount++;
    }

    return {
      ...entry,
      teacherName: canonicalName,
      teacherId: canonicalTeacherId,
      subjectId: canonicalSubjectId,
    };
  });

  // 3. Resolve any teacher overlaps resulting from consolidation (e.g. Rosa M. T. Spanish + English overlaps)
  const overlapResolution = solveTeacherOverlaps(cleanedEntriesDraft, groups, cleanedLoads);
  const finalEntries = overlapResolution.newEntries;

  if (overlapResolution.resolvedCount > 0) {
    auditLog.push(
      `Se resolvieron automáticamente ${overlapResolution.resolvedCount} empalmes derivados de la consolidación docente.`
    );
  }

  // 4. Calculate total workload per teacher & identify orphan / zero-hour records
  const workloadMap = new Map<string, { expected: number; scheduled: number }>();

  cleanedLoads.forEach((l) => {
    Object.values(l.subjects).forEach((s) => {
      const norm = normalizeName(s.teacherName);
      if (!workloadMap.has(norm)) workloadMap.set(norm, { expected: 0, scheduled: 0 });
      workloadMap.get(norm)!.expected += s.hours || 0;
    });
  });

  finalEntries.forEach((e) => {
    if (!e.teacherName) return;
    const norm = normalizeName(e.teacherName);
    if (!workloadMap.has(norm)) workloadMap.set(norm, { expected: 0, scheduled: 0 });
    workloadMap.get(norm)!.scheduled += 1;
  });

  // Check catalog teachers for any registered inactive / zero workload teachers
  const inactiveTeachers: string[] = [];
  TEACHER_CATALOG.forEach((t) => {
    const norm = normalizeName(t.name);
    const workload = workloadMap.get(norm);
    const totalHours = (workload?.expected || 0) + (workload?.scheduled || 0);
    if (totalHours === 0 || !isTeacherActive(t.name, totalHours)) {
      inactiveTeachers.push(t.name);
    }
  });

  // Also check if any advisor has 0 hours total
  cleanedLoads.forEach((l) => {
    if (l.advisor) {
      const norm = normalizeName(l.advisor);
      const workload = workloadMap.get(norm);
      const totalHours = (workload?.expected || 0) + (workload?.scheduled || 0);
      if (totalHours === 0 && !inactiveTeachers.includes(l.advisor)) {
        inactiveTeachers.push(l.advisor);
      }
    }
  });

  const activeTeachersCount = Array.from(workloadMap.entries()).filter(
    ([, w]) => w.expected > 0 || w.scheduled > 0
  ).length;

  return {
    cleanedEntries: finalEntries,
    cleanedLoads,
    resolvedOverlapsCount: overlapResolution.resolvedCount,
    deduplicatedTeachersCount: deduplicatedCount,
    activeTeachersCount,
    inactiveTeachers,
    auditLog,
  };
}

/**
 * Filter list of teachers into active (workload > 0) and inactive (0 hours)
 */
export function filterActiveTeachers(
  teacherNames: string[],
  entries: ScheduleEntry[],
  loads?: AcademicLoadItem[]
): { activeTeachers: string[]; inactiveTeachers: string[] } {
  const hoursMap = new Map<string, number>();

  entries.forEach((e) => {
    if (e.teacherName) {
      const norm = normalizeName(e.teacherName);
      hoursMap.set(norm, (hoursMap.get(norm) || 0) + 1);
    }
  });

  if (loads) {
    loads.forEach((l) => {
      Object.values(l.subjects).forEach((s) => {
        if (s.teacherName) {
          const norm = normalizeName(s.teacherName);
          hoursMap.set(norm, (hoursMap.get(norm) || 0) + (s.hours || 0));
        }
      });
    });
  }

  const activeTeachers: string[] = [];
  const inactiveTeachers: string[] = [];

  teacherNames.forEach((name) => {
    const norm = normalizeName(name);
    const total = hoursMap.get(norm) || 0;
    if (total > 0) {
      activeTeachers.push(name);
    } else {
      inactiveTeachers.push(name);
    }
  });

  return { activeTeachers, inactiveTeachers };
}
