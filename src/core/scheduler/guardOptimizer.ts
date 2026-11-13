import type {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  AcademicLoadItem,
  DutyAssignment,
  DutyZone,
  StaggeredBreakSegmentId,
} from '../../types';
import { normalizeName } from '../../utils/scheduler';
import { getTeacherByNameOrAlias } from '../../data/teacherCatalog';

export interface GuardCandidate {
  teacherName: string;
  teacherId?: string;
  payrollId?: string;
  email?: string;
  whatsapp?: string;
  mainSubject?: string;
  existingDutiesThisWeek: number;
  isFreeInSlot: boolean;
  score: number; // Mayor puntaje = mejor candidato para guardia o suplencia
  reason: string;
}

/**
 * Calcula y rankea los docentes disponibles para cubrir una guardia o suplencia en 1 clic.
 */
export function findOptimalGuardCandidates(params: {
  day: DayOfWeek;
  slot: TimeSlotId;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  existingDuties: DutyAssignment[];
  segmentId?: StaggeredBreakSegmentId;
}): GuardCandidate[] {
  const { day, slot, entries, academicLoads, existingDuties, segmentId } = params;

  const busyTeachers = new Set(
    entries
      .filter((e) => e.day === day && e.slot === slot)
      .map((e) => normalizeName(e.teacherName))
  );

  // Contar guardias ya asignadas en la semana para equilibrar carga
  const dutyCountByTeacher = new Map<string, number>();
  for (const d of existingDuties) {
    const norm = normalizeName(d.teacherName);
    dutyCountByTeacher.set(norm, (dutyCountByTeacher.get(norm) || 0) + 1);
  }

  // En recesos escalonados (módulo 4), docentes cuya clase de 1º/2º/3º está en receso también son elegibles
  const recessEligibleByGrade = new Set<string>();
  if (slot === 4 && segmentId) {
    const targetGradePrefix = String(segmentId); // 1 -> 1A..1H, 2 -> 2A..2H, 3 -> 3A..3H
    for (const e of entries) {
      if (e.day === day && e.slot === 4 && e.groupId.startsWith(targetGradePrefix)) {
        recessEligibleByGrade.add(normalizeName(e.teacherName));
      }
    }
  }

  const allTeacherNames = Array.from(
    new Set([
      ...entries.map((e) => e.teacherName),
      ...academicLoads.flatMap((a) => Object.values(a.subjects || {}).map((s) => s.teacherName)),
    ])
  ).filter(Boolean);

  const candidates: GuardCandidate[] = [];

  for (const rawName of allTeacherNames) {
    const norm = normalizeName(rawName);
    const isBusy = busyTeachers.has(norm);
    const isInTargetRecess = recessEligibleByGrade.has(norm);

    if (isBusy && !isInTargetRecess) continue;

    const catalogEntry = getTeacherByNameOrAlias(rawName);
    const existingCount = dutyCountByTeacher.get(norm) || 0;
    const score = (isBusy ? 40 : 100) - existingCount * 15;

    candidates.push({
      teacherName: catalogEntry?.name || rawName,
      teacherId: catalogEntry?.id,
      payrollId: catalogEntry?.payrollId,
      email: catalogEntry?.email,
      whatsapp: catalogEntry?.whatsapp,
      mainSubject: catalogEntry?.mainSubject,
      existingDutiesThisWeek: existingCount,
      isFreeInSlot: !isBusy,
      score,
      reason: !isBusy
        ? `Hora libre en ${day} ${slot}ª (${existingCount} guardias previas)`
        : `En receso escalonado ${segmentId}º (${existingCount} guardias previas)`,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Crea un registro de guardia en 1 clic seleccionando automáticamente al candidato óptimo si no se especifica uno.
 */
export function buildOneClickDutyAssignment(params: {
  zone: DutyZone;
  day: DayOfWeek;
  slot: TimeSlotId;
  candidate: GuardCandidate;
  segmentId?: StaggeredBreakSegmentId;
}): DutyAssignment {
  const { zone, day, slot, candidate, segmentId } = params;
  return {
    id: `duty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    teacherName: candidate.teacherName,
    teacherId: candidate.teacherId,
    payrollId: candidate.payrollId,
    day,
    slot,
    breakSegmentId: segmentId,
    zone,
    assignedAt: new Date().toISOString(),
  };
}
