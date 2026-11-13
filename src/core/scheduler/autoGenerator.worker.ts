/// <reference lib="webworker" />
import type { DayOfWeek, TimeSlotId, ScheduleEntry } from '../../types';
import type {
  AutoGeneratorRequest,
  AutoGeneratorResult,
  PeriodIndex,
  ScheduleSlot,
} from '../models/schedule.types';
import type { InstitutionConfig } from '../models/institution.types';
import type { TeacherRecord } from '../models/teacher.types';

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS: TimeSlotId[] = [1, 2, 3, 4, 5, 6, 7];
const PERIODS: PeriodIndex[] = [1, 2, 3, 4, 5, 6, 7];

export interface GroupSubjectRequirement {
  groupId: string;
  subject: string;
  weeklyHours: number;
}

/**
 * Generador heurístico directo sobre TeacherRecord[], GroupSubjectRequirement[] e InstitutionConfig.
 */
export function generateScheduleFromBase(
  teachers: TeacherRecord[],
  requirements: GroupSubjectRequirement[],
  institution: InstitutionConfig
): { slots: ScheduleSlot[]; unassigned: GroupSubjectRequirement[] } {
  const slots: ScheduleSlot[] = [];
  const unassigned: GroupSubjectRequirement[] = [];
  const activePeriods = PERIODS.slice(0, institution.periodsPerDay || 7);

  // Rastreo de ocupación O(1) para evitar empalmes de docente o grupo
  const teacherBusy = new Set<string>(); // `${teacherId}-${day}-${period}`
  const groupBusy = new Set<string>(); // `${groupId}-${day}-${period}`
  const teacherHoursCount = new Map<string, number>();

  teachers.forEach((t) => teacherHoursCount.set(t.id, 0));

  // Priorizar docentes con régimen de Contrato o restricciones de día libre
  const sortedTeachers = [...teachers].sort((a, b) => {
    if (a.regime === 'Contrato' && b.regime !== 'Contrato') return -1;
    if (a.regime !== 'Contrato' && b.regime === 'Contrato') return 1;
    return b.contractHours - a.contractHours;
  });

  for (const req of requirements) {
    let remainingHours = req.weeklyHours;

    // Buscar docentes afines a la asignatura con saldo de horas contrato disponible
    const candidates = sortedTeachers.filter(
      (t) =>
        t.baseSubject.toLowerCase() === req.subject.toLowerCase() &&
        (teacherHoursCount.get(t.id) ?? 0) < t.contractHours
    );

    for (const teacher of candidates) {
      if (remainingHours === 0) break;

      for (const day of DAYS) {
        if (teacher.suggestedDayOff === day) continue; // Respeta día libre sugerido

        for (const period of activePeriods) {
          if (remainingHours === 0) break;

          const currentTeacherHours = teacherHoursCount.get(teacher.id) ?? 0;
          if (currentTeacherHours >= teacher.contractHours) break;

          const tKey = `${teacher.id}-${day}-${period}`;
          const gKey = `${req.groupId}-${day}-${period}`;

          if (!teacherBusy.has(tKey) && !groupBusy.has(gKey)) {
            slots.push({
              day,
              period,
              groupId: req.groupId,
              subject: req.subject,
              teacherId: teacher.id,
            });
            teacherBusy.add(tKey);
            groupBusy.add(gKey);
            teacherHoursCount.set(teacher.id, currentTeacherHours + 1);
            remainingHours--;
          }
        }
      }
    }

    if (remainingHours > 0) {
      unassigned.push({ ...req, weeklyHours: remainingHours });
    }
  }

  return { slots, unassigned };
}

function norm(s: string): string {
  return (s || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function getAllowedSlotsForMomento(
  momento: 'RECESO' | 'ANTES' | 'DESPUES' | 'COMPLETO',
  preferred?: TimeSlotId[]
): TimeSlotId[] {
  let base: TimeSlotId[] = SLOTS;
  if (momento === 'RECESO') base = [4, 3, 5, 2, 6, 1, 7];
  else if (momento === 'ANTES') base = [1, 2, 3, 4, 5, 6, 7];
  else if (momento === 'DESPUES') base = [5, 6, 7, 4, 3, 2, 1];

  if (preferred && preferred.length > 0) {
    const prefSet = new Set(preferred);
    return [...base.filter((s) => prefSet.has(s)), ...base.filter((s) => !prefSet.has(s))];
  }
  return base;
}

function computeBridgeHours(entries: ScheduleEntry[]): number {
  const byTeacher = new Map<string, ScheduleEntry[]>();
  for (const e of entries) {
    const k = norm(e.teacherName);
    const list = byTeacher.get(k) || [];
    list.push(e);
    byTeacher.set(k, list);
  }
  let total = 0;
  for (const list of byTeacher.values()) {
    for (const day of DAYS) {
      const slots = Array.from(
        new Set(list.filter((e) => e.day === day).map((e) => Number(e.slot)))
      ).sort((a, b) => a - b);
      if (slots.length >= 2) {
        total += Math.max(0, slots[slots.length - 1] - slots[0] + 1 - slots.length);
      }
    }
  }
  return total;
}

export function solveScheduleHeuristic(
  request: AutoGeneratorRequest,
  onProgress?: (pct: number, phase: string) => void
): AutoGeneratorResult {
  const start = performance.now();
  const entries: ScheduleEntry[] = [...(request.lockedEntries || [])];

  // Índices de ocupación en tiempo real para evitar empalmes O(1)
  const teacherBusy = new Set<string>(); // `${normTeacher}__${day}__${slot}`
  const groupBusy = new Set<string>();   // `${groupId}__${day}__${slot}`
  const roomBusy = new Set<string>();    // `${room}__${day}__${slot}`

  const markOccupied = (e: ScheduleEntry) => {
    teacherBusy.add(`${norm(e.teacherName)}__${e.day}__${e.slot}`);
    groupBusy.add(`${e.groupId}__${e.day}__${e.slot}`);
    if (e.room) roomBusy.add(`${norm(e.room)}__${e.day}__${e.slot}`);
  };

  for (const locked of entries) {
    markOccupied(locked);
  }

  const profileByTeacher = new Map(
    request.teacherProfiles.map((p) => [norm(p.teacherName), p])
  );

  // Construir cola de tareas (bloques por asignar) descontando lo ya fijado
  interface TaskItem {
    groupId: string;
    subject: string;
    teacherName: string;
    teacherId?: string;
    hours: number;
    priority: number;
    remaining: number;
    diaLibre?: DayOfWeek | 'NINGUNO';
    momento: 'RECESO' | 'ANTES' | 'DESPUES' | 'COMPLETO';
    preferredSlots?: TimeSlotId[];
  }

  const tasks: TaskItem[] = [];
  let totalRequested = 0;

  for (const load of request.academicLoads) {
    for (const [subjectName, subInfo] of Object.entries(load.subjects || {})) {
      if (!subInfo || subInfo.hours <= 0 || !subInfo.teacherName) continue;
      totalRequested += subInfo.hours;

      const alreadyAssigned = entries.filter(
        (e) =>
          norm(e.teacherName) === norm(subInfo.teacherName) &&
          e.groupId === load.groupId &&
          norm(e.subject) === norm(subjectName)
      ).length;

      const remaining = Math.max(0, subInfo.hours - alreadyAssigned);
      if (remaining === 0) continue;

      const profile = profileByTeacher.get(norm(subInfo.teacherName));
      const isContrato = profile?.regimenLaboral === 'CONTRATO' || profile?.sharesDoubleShift;
      const hasRestrictedMomento = profile && profile.momentoHorario !== 'COMPLETO';
      const hasFreeDay = profile?.diaLibreSugerido && profile.diaLibreSugerido !== 'NINGUNO';

      // Prioridad: 1) Restricciones rígidas (Contrato doble turno / momento horario / día libre), 2) Mayor carga
      let priority = remaining;
      if (isContrato) priority += 100;
      if (hasRestrictedMomento) priority += 60;
      if (hasFreeDay) priority += 40;

      tasks.push({
        groupId: load.groupId,
        subject: subjectName,
        teacherName: subInfo.teacherName,
        teacherId: subInfo.teacherId,
        hours: subInfo.hours,
        priority,
        remaining,
        diaLibre: profile?.diaLibreSugerido,
        momento: profile?.momentoHorario || 'COMPLETO',
        preferredSlots: subInfo.specificSlots || profile?.preferredSlots,
      });
    }
  }

  // Ordenar por restricciones más duras primero (Heuristic MRV / Constraint First)
  tasks.sort((a, b) => b.priority - a.priority);
  onProgress?.(15, 'Asignando bloques rígidos y restricciones duras (Contrato / Día libre)...');

  const unassignedDetails: AutoGeneratorResult['unassignedDetails'] = [];

  for (let idx = 0; idx < tasks.length; idx++) {
    const task = tasks[idx];
    const tNorm = norm(task.teacherName);
    const preferredOrder = getAllowedSlotsForMomento(task.momento, task.preferredSlots);

    for (let h = 0; h < task.remaining; h++) {
      let bestCandidate: { day: DayOfWeek; slot: TimeSlotId; score: number } | null = null;

      for (const day of DAYS) {
        // Respetar día libre sugerido en el primer pase
        if (task.diaLibre && task.diaLibre !== 'NINGUNO' && day === task.diaLibre) {
          continue;
        }

        // Evitar >2 horas de la misma asignatura en el mismo grupo el mismo día
        const sameSubjToday = entries.filter(
          (e) =>
            e.groupId === task.groupId &&
            e.day === day &&
            norm(e.subject) === norm(task.subject)
        ).length;
        if (sameSubjToday >= 2) continue;

        const teacherSlotsToday = entries
          .filter((e) => norm(e.teacherName) === tNorm && e.day === day)
          .map((e) => Number(e.slot));

        for (let sIdx = 0; sIdx < preferredOrder.length; sIdx++) {
          const slot = preferredOrder[sIdx];
          if (teacherBusy.has(`${tNorm}__${day}__${slot}`)) continue;
          if (groupBusy.has(`${task.groupId}__${day}__${slot}`)) continue;

          // Puntuación heurística:
          // +50 si es adyacente a una clase existente del docente ese día (minimiza horas puente)
          // +20 por preferencia de momento horario
          // -10 si ya hay muchas clases ese día para balancear la semana
          let score = 100 - sIdx * 3;
          const isAdjacent = teacherSlotsToday.some((s) => Math.abs(s - slot) === 1);
          if (isAdjacent) score += 50;
          else if (teacherSlotsToday.length > 0) score -= 20; // penalizar huecos intermedios

          if (sameSubjToday === 1) score += 10; // favorece bloques dobles continuos si es adyacente

          if (!bestCandidate || score > bestCandidate.score) {
            bestCandidate = { day, slot, score };
          }
        }
      }

      // Segundo pase: si no hubo espacio respetando día libre o límite diario, relajar solo esas restricciones suaves
      if (!bestCandidate) {
        for (const day of DAYS) {
          for (const slot of preferredOrder) {
            if (teacherBusy.has(`${tNorm}__${day}__${slot}`)) continue;
            if (groupBusy.has(`${task.groupId}__${day}__${slot}`)) continue;
            bestCandidate = { day, slot, score: 1 };
            break;
          }
          if (bestCandidate) break;
        }
      }

      if (bestCandidate) {
        const newEntry: ScheduleEntry = {
          id: `auto-${task.groupId}-${bestCandidate.day}-${bestCandidate.slot}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          day: bestCandidate.day,
          slot: bestCandidate.slot,
          groupId: task.groupId,
          teacherName: task.teacherName,
          teacherId: task.teacherId,
          subject: task.subject,
          room: `Aula ${task.groupId}`,
        };
        entries.push(newEntry);
        markOccupied(newEntry);
      } else {
        const existing = unassignedDetails.find(
          (u) =>
            u.teacherName === task.teacherName &&
            u.groupId === task.groupId &&
            u.subject === task.subject
        );
        if (existing) {
          existing.remainingHours += 1;
        } else {
          unassignedDetails.push({
            teacherName: task.teacherName,
            groupId: task.groupId,
            subject: task.subject,
            remainingHours: 1,
            reason: 'Sin disponibilidad simultánea de docente y grupo sin empalme',
          });
        }
      }
    }

    if (idx % 10 === 0) {
      const pct = Math.min(95, 15 + Math.round(((idx + 1) / tasks.length) * 80));
      onProgress?.(pct, 'Distribuyendo carga curricular y minimizando horas puente...');
    }
  }

  onProgress?.(100, 'Generación completada');

  const unassignedCount = unassignedDetails.reduce((s, u) => s + u.remainingHours, 0);
  return {
    entries,
    conflicts: [],
    stats: {
      totalAssigned: entries.length,
      totalRequested,
      unassignedCount,
      totalBridgeHours: computeBridgeHours(entries),
      elapsedMs: Math.round(performance.now() - start),
    },
    unassignedDetails,
  };
}

// Listener del Web Worker dedicado
if (typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = (event: MessageEvent<AutoGeneratorRequest>) => {
    try {
      const result = solveScheduleHeuristic(event.data, (progress, phase) => {
        self.postMessage({ type: 'PROGRESS', progress, phase });
      });
      self.postMessage({ type: 'DONE', result });
    } catch (err: any) {
      self.postMessage({
        type: 'ERROR',
        error: err?.message || 'Error inesperado en el Web Worker de generación.',
      });
    }
  };
}
