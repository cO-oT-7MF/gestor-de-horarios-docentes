import type { ScheduleEntry, AcademicLoadItem, Conflict, DayOfWeek, TimeSlotId, Group } from '../../types';
import { detectConflicts as baseDetectConflicts, normalizeName } from '../../utils/scheduler';
import { GROUPS } from '../../data/initialData';

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export interface TeacherBridgeAnalysis {
  teacherName: string;
  totalAssignedHours: number;
  totalBridgeHours: number;
  bridgeByDay: Partial<Record<DayOfWeek, number>>;
}

export interface ExtendedConflictReport {
  conflicts: Conflict[];
  classroomOverlaps: {
    room: string;
    day: DayOfWeek;
    slot: TimeSlotId;
    entries: ScheduleEntry[];
  }[];
  totalBridgeHours: number;
  teacherBridges: TeacherBridgeAnalysis[];
}

/**
 * Calcula las horas libres intermedias ("horas puente") de un docente en la semana.
 * Una hora puente es un bloque vacío entre la primera y última clase asignada de un mismo día.
 */
export function calculateTeacherBridgeHours(
  entries: ScheduleEntry[],
  teacherName: string
): TeacherBridgeAnalysis {
  const normTarget = normalizeName(teacherName);
  const teacherEntries = entries.filter((e) => normalizeName(e.teacherName) === normTarget);

  let totalBridgeHours = 0;
  const bridgeByDay: Partial<Record<DayOfWeek, number>> = {};

  for (const day of DAYS) {
    const slots = teacherEntries
      .filter((e) => e.day === day)
      .map((e) => Number(e.slot))
      .sort((a, b) => a - b);

    if (slots.length >= 2) {
      const uniqueSlots = Array.from(new Set(slots));
      const span = uniqueSlots[uniqueSlots.length - 1] - uniqueSlots[0] + 1;
      const gaps = Math.max(0, span - uniqueSlots.length);
      if (gaps > 0) {
        bridgeByDay[day] = gaps;
        totalBridgeHours += gaps;
      }
    }
  }

  return {
    teacherName,
    totalAssignedHours: teacherEntries.length,
    totalBridgeHours,
    bridgeByDay,
  };
}

/**
 * Detección integral de empalmes docente/grupo/aula, balance de horas y horas puente.
 */
export function analyzeScheduleConflicts(
  entries: ScheduleEntry[],
  academicLoads: AcademicLoadItem[],
  groups: Group[] = GROUPS
): ExtendedConflictReport {
  const conflicts = baseDetectConflicts(entries, groups, academicLoads);

  // Detectar empalmes de aula (misma aula, mismo día y módulo con >1 grupo)
  const roomMap = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const room = entry.room?.trim();
    if (!room) continue;
    const key = `${room.toUpperCase()}__${entry.day}__${entry.slot}`;
    const list = roomMap.get(key) || [];
    list.push(entry);
    roomMap.set(key, list);
  }

  const classroomOverlaps: ExtendedConflictReport['classroomOverlaps'] = [];
  for (const [, list] of roomMap.entries()) {
    if (list.length > 1) {
      classroomOverlaps.push({
        room: list[0].room || '',
        day: list[0].day,
        slot: list[0].slot,
        entries: list,
      });
    }
  }

  // Calcular horas puente globales por docente
  const uniqueTeachers = Array.from(new Set(entries.map((e) => normalizeName(e.teacherName)))).filter(
    Boolean
  );
  const teacherBridges = uniqueTeachers.map((t) => calculateTeacherBridgeHours(entries, t));
  const totalBridgeHours = teacherBridges.reduce((sum, tb) => sum + tb.totalBridgeHours, 0);

  return {
    conflicts,
    classroomOverlaps,
    totalBridgeHours,
    teacherBridges: teacherBridges.sort((a, b) => b.totalBridgeHours - a.totalBridgeHours),
  };
}
