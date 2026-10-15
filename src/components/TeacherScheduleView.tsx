import React, { useState, useMemo, useEffect } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Conflict,
  Group,
  TimeSlotConfig,
  AcademicLoadItem,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import {
  getSubjectConfig,
  getTeacherStats,
  normalizeName,
} from '../utils/scheduler';
import { useTheme } from '../context/ThemeContext';
import { TeacherWorkloadDashboard } from './TeacherWorkloadDashboard';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  BookOpen,
  Layers,
  AlertCircle,
  AlertTriangle,
  Plus,
  Printer,
  Sparkles,
  Search,
  X,
  Filter,
  CheckSquare,
  Square,
  ArrowRightLeft,
  CheckCircle2,
  Check,
  MoveRight,
  RotateCcw,
  Zap,
  Info,
  Mail,
} from 'lucide-react';
import { TeacherContactBadge } from './TeacherContactBadge';
import { MassNotificationModal } from './MassNotificationModal';

interface TeacherScheduleViewProps {
  entries: ScheduleEntry[];
  allTeachers: string[];
  selectedTeacher: string;
  setSelectedTeacher: (teacher: string) => void;
  conflicts: Conflict[];
  groups: Group[];
  academicLoads?: AcademicLoadItem[];
  timeSlots?: TimeSlotConfig[];
  onEditSlot: (day: DayOfWeek, slot: TimeSlotId, teacherName?: string, groupId?: string) => void;
  onPrintTeacher: (teacherName: string) => void;
  onSolveConflict?: (conflict: Conflict) => void;
  onSolveAllConflicts?: () => void;
  onUpdateEntries?: (newEntries: ScheduleEntry[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info' | 'save' | 'undo' | 'redo', shortcut?: string) => void;
}

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  entries,
  allTeachers,
  selectedTeacher,
  setSelectedTeacher,
  conflicts,
  groups = [],
  academicLoads = [],
  timeSlots = TIME_SLOTS,
  onEditSlot,
  onPrintTeacher,
  onSolveConflict,
  onSolveAllConflicts,
  onUpdateEntries,
  onShowToast,
}) => {
  const { isLight } = useTheme();
  const [searchFilter, setSearchFilter] = useState('');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [isMassNotifyModalOpen, setIsMassNotifyModalOpen] = useState(false);
  const [mobileActiveDay, setMobileActiveDay] = useState<DayOfWeek>('Lunes');
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'day_cards' | 'full_table'>('day_cards');

  const filteredTeachers = allTeachers.filter((t) =>
    t.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentIndex = allTeachers.indexOf(selectedTeacher);
  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedTeacher(allTeachers[currentIndex - 1]);
    } else {
      setSelectedTeacher(allTeachers[allTeachers.length - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < allTeachers.length - 1) {
      setSelectedTeacher(allTeachers[currentIndex + 1]);
    } else {
      setSelectedTeacher(allTeachers[0]);
    }
  };

  const teacherStats = getTeacherStats(selectedTeacher, entries);

  // Check if current teacher has any conflicts
  const teacherConflicts = conflicts.filter(
    (c) =>
      c.teacherName &&
      normalizeName(c.teacherName) === normalizeName(selectedTeacher)
  );

  // Search & filter within the schedule entries
  const trimmedSearch = scheduleSearchQuery.trim().toLowerCase();

  const totalTeacherEntries = useMemo(() => {
    return entries.filter(
      (e) => normalizeName(e.teacherName) === normalizeName(selectedTeacher)
    );
  }, [entries, selectedTeacher]);

  const matchingTeacherEntries = useMemo(() => {
    if (!trimmedSearch) return [];
    return totalTeacherEntries.filter((e) => {
      const sub = (e.subject || '').toLowerCase();
      const grp = (e.groupId || '').toLowerCase();
      const day = (e.day || '').toLowerCase();
      return sub.includes(trimmedSearch) || grp.includes(trimmedSearch) || day.includes(trimmedSearch);
    });
  }, [totalTeacherEntries, trimmedSearch]);

  const teacherSubjects = useMemo(() => {
    const map = new Map<string, number>();
    totalTeacherEntries.forEach((e) => {
      map.set(e.subject, (map.get(e.subject) || 0) + 1);
    });
    return Array.from(map.entries()).map(([subject, count]) => ({ subject, count }));
  }, [totalTeacherEntries]);

  const teacherGroups = useMemo(() => {
    const set = new Set<string>();
    totalTeacherEntries.forEach((e) => set.add(e.groupId));
    return Array.from(set).sort();
  }, [totalTeacherEntries]);

  // Expected hours for selected teacher from official academic loads
  const selectedTeacherContract = useMemo(() => {
    let expectedHours = 0;
    const norm = normalizeName(selectedTeacher);
    for (const load of academicLoads) {
      if (!load.subjects) continue;
      for (const [, val] of Object.entries(load.subjects)) {
        const subVal = val as { teacherName?: string; hours?: number } | undefined;
        if (subVal && subVal.teacherName && normalizeName(subVal.teacherName) === norm) {
          expectedHours += subVal.hours || 0;
        }
      }
    }
    const assignedHours = teacherStats.totalHours;
    const percentage =
      expectedHours > 0
        ? Math.round((assignedHours / expectedHours) * 100)
        : assignedHours > 0
        ? 100
        : 0;
    const difference = assignedHours - expectedHours;
    return { expectedHours, assignedHours, percentage, difference };
  }, [academicLoads, selectedTeacher, teacherStats.totalHours]);

  // Multi-select & Bulk Move states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [bulkMoveMode, setBulkMoveMode] = useState<'change_day' | 'change_slot' | 'custom_day_slot'>('change_day');
  const [bulkTargetDay, setBulkTargetDay] = useState<DayOfWeek>('Martes');
  const [bulkTargetStartSlot, setBulkTargetStartSlot] = useState<TimeSlotId>(1);
  const [packConsecutive, setPackConsecutive] = useState(false);
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  // Clear selection when teacher changes
  useEffect(() => {
    setSelectedEntryIds([]);
    setIsMultiSelectMode(false);
  }, [selectedTeacher]);

  const toggleSelectEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectDayEntries = (day: DayOfWeek) => {
    const dayEntryIds = totalTeacherEntries
      .filter((e) => e.day === day)
      .map((e) => e.id);
    if (dayEntryIds.length === 0) return;
    const allSelected = dayEntryIds.every((id) => selectedEntryIds.includes(id));
    if (allSelected) {
      setSelectedEntryIds((prev) => prev.filter((id) => !dayEntryIds.includes(id)));
    } else {
      setSelectedEntryIds((prev) => Array.from(new Set([...prev, ...dayEntryIds])));
    }
  };

  const selectAllTeacherEntries = () => {
    const allIds = totalTeacherEntries.map((e) => e.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedEntryIds.includes(id));
    if (allSelected) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(allIds);
    }
  };

  const clearSelection = () => {
    setSelectedEntryIds([]);
  };

  const selectedEntries = useMemo(() => {
    return totalTeacherEntries.filter((e) => selectedEntryIds.includes(e.id));
  }, [totalTeacherEntries, selectedEntryIds]);

  const sortedSelectedEntries = useMemo(() => {
    const dayOrder: Record<DayOfWeek, number> = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Jueves: 3,
      Viernes: 4,
    };
    return [...selectedEntries].sort((a, b) => {
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }
      return a.slot - b.slot;
    });
  }, [selectedEntries]);

  // When selection changes, initialize sensible defaults for destination
  useEffect(() => {
    if (sortedSelectedEntries.length > 0) {
      const primaryDay = sortedSelectedEntries[0].day;
      const dayIndex = DAYS_OF_WEEK.indexOf(primaryDay);
      const nextDay = DAYS_OF_WEEK[(dayIndex + 1) % DAYS_OF_WEEK.length];
      setBulkTargetDay((prev) => (prev === primaryDay ? nextDay : prev));
      setBulkTargetStartSlot(sortedSelectedEntries[0].slot);
    }
  }, [sortedSelectedEntries.length]);

  // Compute proposed moves
  const proposedMoves = useMemo(() => {
    if (sortedSelectedEntries.length === 0) return [];

    const minSlot = Math.min(...sortedSelectedEntries.map((e) => e.slot));

    return sortedSelectedEntries.map((entry, index) => {
      let newDay: DayOfWeek = entry.day;
      let newSlot: number = entry.slot;

      if (bulkMoveMode === 'change_day') {
        newDay = bulkTargetDay;
        newSlot = entry.slot;
      } else if (bulkMoveMode === 'change_slot') {
        newDay = entry.day;
        if (packConsecutive) {
          newSlot = bulkTargetStartSlot + index;
        } else {
          const offset = entry.slot - minSlot;
          newSlot = bulkTargetStartSlot + offset;
        }
      } else if (bulkMoveMode === 'custom_day_slot') {
        newDay = bulkTargetDay;
        if (packConsecutive) {
          newSlot = bulkTargetStartSlot + index;
        } else {
          const offset = entry.slot - minSlot;
          newSlot = bulkTargetStartSlot + offset;
        }
      }

      const isValidSlot = newSlot >= 1 && newSlot <= 7;

      return {
        entry,
        originalDay: entry.day,
        originalSlot: entry.slot,
        newDay,
        newSlot: (isValidSlot ? newSlot : entry.slot) as TimeSlotId,
        rawSlot: newSlot,
        isValidSlot,
      };
    });
  }, [sortedSelectedEntries, bulkMoveMode, bulkTargetDay, bulkTargetStartSlot, packConsecutive]);

  // Real-time Conflict checking for the proposed bulk move
  const bulkConflicts = useMemo(() => {
    if (proposedMoves.length === 0) return [];

    const list: Array<{
      type: 'OUT_OF_BOUNDS' | 'INTERNAL_COLLISION' | 'TEACHER_OVERLAP' | 'GROUP_OVERLAP';
      message: string;
      day: DayOfWeek;
      slot: number;
      entry: ScheduleEntry;
      existingEntry?: ScheduleEntry;
      severity: 'error';
    }> = [];

    const otherEntries = entries.filter((e) => !selectedEntryIds.includes(e.id));
    const internalPositions = new Map<string, ScheduleEntry>();

    for (const move of proposedMoves) {
      // 1. Boundary check
      if (!move.isValidSlot || move.rawSlot < 1 || move.rawSlot > 7) {
        list.push({
          type: 'OUT_OF_BOUNDS',
          message: `La clase "${move.entry.subject}" (${move.entry.groupId}) sobrepasa los módulos válidos (Hora ${move.rawSlot}). Solo se permiten horas del 1 al 7.`,
          day: move.newDay,
          slot: move.rawSlot,
          entry: move.entry,
          severity: 'error',
        });
        continue;
      }

      // 2. Internal collision between moved entries
      const posKey = `${move.newDay}-${move.newSlot}`;
      if (internalPositions.has(posKey)) {
        const coll = internalPositions.get(posKey)!;
        list.push({
          type: 'INTERNAL_COLLISION',
          message: `Colisión interna: Dos clases seleccionadas ("${move.entry.subject}" y "${coll.subject}") se colocarían en el mismo horario (${move.newDay}, Hora ${move.newSlot}).`,
          day: move.newDay,
          slot: move.newSlot,
          entry: move.entry,
          existingEntry: coll,
          severity: 'error',
        });
      } else {
        internalPositions.set(posKey, move.entry);
      }

      // 3. Teacher overlap with other scheduled classes of the same teacher
      const teacherCollision = otherEntries.find(
        (e) =>
          normalizeName(e.teacherName) === normalizeName(selectedTeacher) &&
          e.day === move.newDay &&
          e.slot === move.newSlot
      );
      if (teacherCollision) {
        list.push({
          type: 'TEACHER_OVERLAP',
          message: `Empalme de Docente: ${selectedTeacher} ya tiene clase asignada de "${teacherCollision.subject}" en Grupo ${teacherCollision.groupId} el ${move.newDay} a la Hora ${move.newSlot}.`,
          day: move.newDay,
          slot: move.newSlot,
          entry: move.entry,
          existingEntry: teacherCollision,
          severity: 'error',
        });
      }

      // 4. Group overlap with other classes scheduled for this group
      const groupCollision = otherEntries.find(
        (e) =>
          e.groupId.trim().toUpperCase() === move.entry.groupId.trim().toUpperCase() &&
          e.day === move.newDay &&
          e.slot === move.newSlot
      );
      if (groupCollision) {
        list.push({
          type: 'GROUP_OVERLAP',
          message: `Empalme de Grupo: El Grupo ${move.entry.groupId} ya tiene clase de "${groupCollision.subject}" con ${groupCollision.teacherName} el ${move.newDay} a la Hora ${move.newSlot}.`,
          day: move.newDay,
          slot: move.newSlot,
          entry: move.entry,
          existingEntry: groupCollision,
          severity: 'error',
        });
      }
    }

    return list;
  }, [proposedMoves, entries, selectedEntryIds, selectedTeacher]);

  // Smart conflict-free alternative slot calculation
  const conflictFreeAlternative = useMemo(() => {
    if (sortedSelectedEntries.length === 0 || bulkConflicts.length === 0) return null;
    const otherEntries = entries.filter((e) => !selectedEntryIds.includes(e.id));
    const count = sortedSelectedEntries.length;

    const daysToTry: DayOfWeek[] = [
      ...DAYS_OF_WEEK.filter((d) => d !== bulkTargetDay),
      bulkTargetDay,
    ];

    // Priority 1: Check same slot positions on other days
    for (const day of daysToTry) {
      let cleanSameSlots = true;
      for (const entry of sortedSelectedEntries) {
        const hasTeacher = otherEntries.some(
          (e) =>
            normalizeName(e.teacherName) === normalizeName(selectedTeacher) &&
            e.day === day &&
            e.slot === entry.slot
        );
        const hasGroup = otherEntries.some(
          (e) =>
            e.groupId.trim().toUpperCase() === entry.groupId.trim().toUpperCase() &&
            e.day === day &&
            e.slot === entry.slot
        );
        if (hasTeacher || hasGroup) {
          cleanSameSlots = false;
          break;
        }
      }
      if (cleanSameSlots) {
        return {
          day,
          startSlot: sortedSelectedEntries[0].slot,
          mode: 'change_day' as const,
          packConsecutive: false,
          description: `${day} conservando las horas actuales (${sortedSelectedEntries.map((e) => `H${e.slot}`).join(', ')})`,
        };
      }
    }

    // Priority 2: Check contiguous blocks on any day
    for (const day of daysToTry) {
      const maxStart = 7 - count + 1;
      for (let s = 1; s <= maxStart; s++) {
        let cleanBlock = true;
        for (let i = 0; i < count; i++) {
          const entry = sortedSelectedEntries[i];
          const candSlot = (s + i) as TimeSlotId;
          const hasTeacher = otherEntries.some(
            (e) =>
              normalizeName(e.teacherName) === normalizeName(selectedTeacher) &&
              e.day === day &&
              e.slot === candSlot
          );
          const hasGroup = otherEntries.some(
            (e) =>
              e.groupId.trim().toUpperCase() === entry.groupId.trim().toUpperCase() &&
              e.day === day &&
              e.slot === candSlot
          );
          if (hasTeacher || hasGroup) {
            cleanBlock = false;
            break;
          }
        }
        if (cleanBlock) {
          return {
            day,
            startSlot: s as TimeSlotId,
            mode: 'custom_day_slot' as const,
            packConsecutive: true,
            description: `${day} en bloque continuo a partir de la Hora ${s} (Horas ${s} a ${s + count - 1})`,
          };
        }
      }
    }

    return null;
  }, [sortedSelectedEntries, bulkConflicts.length, entries, selectedEntryIds, selectedTeacher, bulkTargetDay]);

  const handleApplySuggestion = () => {
    if (!conflictFreeAlternative) return;
    setBulkTargetDay(conflictFreeAlternative.day);
    setBulkTargetStartSlot(conflictFreeAlternative.startSlot);
    setBulkMoveMode(conflictFreeAlternative.mode);
    setPackConsecutive(conflictFreeAlternative.packConsecutive || false);
  };

  const handleApplyBulkMove = (forceWithConflicts = false) => {
    if (proposedMoves.length === 0 || !onUpdateEntries) return;
    if (!forceWithConflicts && bulkConflicts.length > 0) return;

    const moveMap = new Map<string, { newDay: DayOfWeek; newSlot: TimeSlotId }>();
    for (const move of proposedMoves) {
      if (move.isValidSlot) {
        moveMap.set(move.entry.id, { newDay: move.newDay, newSlot: move.newSlot });
      }
    }

    const newEntries: ScheduleEntry[] = entries.map((e) => {
      const target = moveMap.get(e.id);
      if (target) {
        return {
          ...e,
          day: target.newDay,
          slot: target.newSlot,
        };
      }
      return e;
    });

    onUpdateEntries(newEntries);

    if (onShowToast) {
      const count = proposedMoves.length;
      const msg = `Se reubicaron ${count} clase${count > 1 ? 's' : ''} de ${selectedTeacher} correctamente.`;
      onShowToast(msg, 'success');
    }

    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {
      // safe fallback
    }

    setSelectedEntryIds([]);
    setIsMultiSelectMode(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {/* Mini-Dashboard: Teacher Workload & Expected Contract Hours Progress Bar */}
      <TeacherWorkloadDashboard
        allTeachers={allTeachers}
        academicLoads={academicLoads}
        entries={entries}
        conflicts={conflicts}
        selectedTeacher={selectedTeacher}
        onSelectTeacher={(t) => {
          setSelectedTeacher(t);
        }}
      />

      {/* Teacher Selection & Stats Header */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 p-5 shadow-xl shadow-black/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Teacher Selector & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrev}
                title="Docente anterior"
                className="p-2 rounded-lg border border-slate-700/80 bg-[#16181f] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                title="Docente siguiente"
                className="p-2 rounded-lg border border-slate-700/80 bg-[#16181f] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative min-w-[280px]">
              <label htmlFor="teacher-select" className="sr-only">Seleccionar Docente</label>
              <select
                id="teacher-select"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-slate-700 text-slate-100 text-base font-bold rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer"
              >
                {allTeachers.map((t) => {
                  const st = getTeacherStats(t, entries);
                  return (
                    <option key={t} value={t} className="bg-[#111318] text-slate-200">
                      {t} ({st.totalHours} hrs asignadas)
                    </option>
                  );
                })}
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar docente..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-[#0a0a0a] border border-slate-700 text-slate-200 placeholder-slate-500 text-sm rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all border shadow-xs cursor-pointer ${
                isMultiSelectMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold ring-2 ring-amber-400/40'
                  : 'bg-[#1c202a] border-slate-700/80 text-slate-200 hover:bg-slate-800'
              }`}
              title="Seleccionar múltiples horas para moverlas en bloque a otro día u horario"
            >
              <ArrowRightLeft className={`w-4 h-4 ${isMultiSelectMode ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{isMultiSelectMode ? 'Modo Reubicación Activo' : 'Mover Horas en Bloque'}</span>
              {selectedEntryIds.length > 0 && (
                <span className="px-1.5 py-0.2 text-xs rounded-full bg-slate-950 text-amber-300 font-black">
                  {selectedEntryIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMassNotifyModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Enviar correo masivo con copia oculta a toda la plantilla docente (40 docentes)"
            >
              <Mail className="w-4 h-4 text-blue-200" />
              <span>Notificar Plantilla</span>
            </button>

            <button
              onClick={() => onPrintTeacher(selectedTeacher)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1c202a] border border-slate-700/80 text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Imprimir Horario</span>
            </button>
          </div>
        </div>

        {/* Selected Teacher Contact Details & Direct Quick Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">
              Contacto directo de <strong className="text-amber-300 font-extrabold">{selectedTeacher}</strong>:
            </span>
            <TeacherContactBadge teacherName={selectedTeacher} variant="header" />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="hidden md:inline">¿Aviso general?</span>
            <button
              type="button"
              onClick={() => setIsMassNotifyModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
            >
              Enviar correo masivo a toda la plantilla (BCC)
            </button>
          </div>
        </div>

        {/* Quick Filter Pills if searching */}
        {searchFilter && (
          <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
            {filteredTeachers.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTeacher(t);
                  setSearchFilter('');
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  t === selectedTeacher
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-[#16181f] text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Stats Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Módulos Contrato (40m)</span>
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                    selectedTeacherContract.expectedHours === 0
                      ? 'bg-slate-800 text-slate-400'
                      : selectedTeacherContract.difference === 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : selectedTeacherContract.difference < 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {selectedTeacherContract.expectedHours === 0
                    ? 'Sin plantilla'
                    : selectedTeacherContract.difference === 0
                    ? '100% Cubierto'
                    : selectedTeacherContract.difference < 0
                    ? `Faltan ${Math.abs(selectedTeacherContract.difference)} mód`
                    : `+${selectedTeacherContract.difference} mód extra`}
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-100">
                {teacherStats.totalHours}{' '}
                <span className="text-xs font-medium text-slate-500">
                  / {selectedTeacherContract.expectedHours} módulos ({selectedTeacherContract.percentage}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-700/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  selectedTeacherContract.expectedHours === 0
                    ? 'bg-slate-600'
                    : selectedTeacherContract.difference === 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : selectedTeacherContract.difference < 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-rose-500 to-rose-400'
                }`}
                style={{ width: `${Math.min(100, selectedTeacherContract.percentage)}%` }}
              />
            </div>
          </div>

          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Módulos Libres</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-400">
              {teacherStats.freeHoursFrom35}{' '}
              <span className="text-xs font-medium text-slate-500">módulos</span>
            </div>
          </div>

          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Grupos Atendidos</span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {teacherStats.groups.length}{' '}
              <span className="text-xs font-medium text-slate-500">grupos</span>
            </div>
          </div>

          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Asignatura(s)</span>
            </div>
            <div className="text-sm font-bold text-slate-200 truncate" title={teacherStats.subjects.join(', ')}>
              {teacherStats.subjects.join(', ') || 'Sin Asignar'}
            </div>
          </div>

          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Huecos Intermedios</span>
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {teacherStats.intermediateGaps}{' '}
              <span className="text-xs font-medium text-slate-500">periodos</span>
            </div>
          </div>

          <div className="bg-[#16181f] rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
              <AlertCircle className={`w-3.5 h-3.5 ${teacherConflicts.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Estado Empalmes</span>
            </div>
            <div className={`text-sm font-bold ${teacherConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {teacherConflicts.length > 0 ? `${teacherConflicts.length} Conflicto(s)` : '✓ Sin Empalmes'}
            </div>
          </div>
        </div>

        {/* Group Badges List */}
        {teacherStats.groups.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400">Grupos asignados:</span>
            {teacherStats.groups.map((g) => (
              <span
                key={g}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#16181f] text-slate-200 border border-slate-700"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Conflict Warning Banner if any */}
        {teacherConflicts.length > 0 && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                : 'bg-rose-950/50 border-rose-800/80 text-rose-200 shadow-md shadow-rose-950/40'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-rose-500">
                  ¡Atención! Este docente presenta {teacherConflicts.length} empalme(s) de horario:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                  {teacherConflicts.map((c) => (
                    <li key={c.id} className="text-xs">
                      <span>{c.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {(onSolveAllConflicts || onSolveConflict) && (
              <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                <button
                  onClick={() => {
                    if (onSolveAllConflicts) {
                      onSolveAllConflicts();
                    } else if (onSolveConflict && teacherConflicts.length > 0) {
                      onSolveConflict(teacherConflicts[0]);
                    }
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Resolución Fluida Automática (100% Horas sin Empalmes)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Missing hours banner if teacher is under contracted hours */}
        {selectedTeacherContract.difference < 0 && teacherConflicts.length === 0 && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-200 shadow-md shadow-amber-950/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-amber-500">
                  Horas pendientes por programar: Faltan {Math.abs(selectedTeacherContract.difference)} periodos
                </p>
                <p className="opacity-90">
                  Este docente tiene asignadas {selectedTeacherContract.expectedHours} horas en plantilla, pero solo tiene {teacherStats.totalHours} horas en el horario.
                </p>
              </div>
            </div>

            {onSolveAllConflicts && (
              <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                <button
                  onClick={onSolveAllConflicts}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Completar 100% de Horas de Forma Fluida</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 shadow-xl shadow-black/40 overflow-hidden">
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-base font-bold">
              Horario Individual: <span className="text-amber-300">{selectedTeacher}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher for Mobile / Tablet / Desktop */}
            <div className="inline-flex rounded-lg bg-slate-900/90 p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMobileLayoutMode('day_cards')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  mobileLayoutMode === 'day_cards'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista de tarjetas por día adaptada para celulares y tablets (sin zoom)"
              >
                Vista por Día (Móvil)
              </button>
              <button
                type="button"
                onClick={() => setMobileLayoutMode('full_table')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  mobileLayoutMode === 'full_table'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Vista de malla semanal completa (5 días)"
              >
                Malla Semanal
              </button>
            </div>
            <span className="hidden xl:inline text-xs text-slate-400 font-medium">
              Turno Vespertino (13:00 - 18:00) • Periodos 40 min
            </span>
          </div>
        </div>

        {/* Schedule Entry Search & Quick Filter Toolbar */}
        <div className={`p-3 sm:px-4 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141720] border-slate-800'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={scheduleSearchQuery}
                onChange={(e) => setScheduleSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setScheduleSearchQuery('');
                }}
                aria-label="Buscar en el horario del docente"
                placeholder="Buscar materia, grupo o día en este horario (ej. Matemáticas, 1A)..."
                className={`w-full pl-9 pr-8 py-2 rounded-lg text-xs sm:text-sm transition-all border outline-hidden ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    : 'bg-[#0a0c10] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
              {scheduleSearchQuery && (
                <button
                  onClick={() => setScheduleSearchQuery('')}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-700/30 transition-colors ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Badge */}
            <div className="flex items-center gap-2">
              {trimmedSearch ? (
                <div
                  className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border transition-all ${
                    matchingTeacherEntries.length > 0
                      ? isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : isLight
                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Filter className="w-3 h-3 text-amber-500" />
                  <span>
                    {matchingTeacherEntries.length > 0
                      ? `${matchingTeacherEntries.length} clase(s) encontrada(s)`
                      : 'Sin coincidencias en este horario'}
                  </span>
                  <button
                    onClick={() => setScheduleSearchQuery('')}
                    className="ml-1 hover:opacity-80 underline text-[11px]"
                  >
                    Limpiar
                  </button>
                </div>
              ) : (
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {totalTeacherEntries.length} periodos asignados en total
                </span>
              )}

              {/* Multi-Select & Bulk Relocation Action Button */}
              <button
                onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isMultiSelectMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    : 'bg-[#0a0c10] text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
                title="Activar modo de selección múltiple para mover clases en bloque"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${isMultiSelectMode ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{isMultiSelectMode ? 'Modo Selección Activo' : 'Mover en Bloque'}</span>
                {selectedEntryIds.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-950 text-amber-300 font-black">
                    {selectedEntryIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter Chips for subjects and groups */}
          {teacherSubjects.length > 0 && (
            <div className={`mt-2.5 pt-2.5 border-t flex flex-wrap items-center gap-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Filtro rápido:
              </span>
              <button
                onClick={() => setScheduleSearchQuery('')}
                className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold transition-all border ${
                  !trimmedSearch
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    : 'bg-[#0e1015] text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Todas las materias
              </button>
              {teacherSubjects.map(({ subject, count }) => {
                const isActive = trimmedSearch === subject.toLowerCase();
                return (
                  <button
                    key={subject}
                    onClick={() => setScheduleSearchQuery(isActive ? '' : subject)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all border flex items-center gap-1 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-300'
                        : 'bg-[#0e1015] text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>{subject}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-black/20 text-slate-950'
                        : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}h
                    </span>
                  </button>
                );
              })}
              {teacherGroups.length > 1 && (
                <div className={`flex items-center gap-1 ml-2 border-l pl-2 ${isLight ? 'border-slate-300' : 'border-slate-700/60'}`}>
                  <span className={`text-[10px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Grupos:</span>
                  {teacherGroups.map((grp) => {
                    const isActive = trimmedSearch === grp.toLowerCase();
                    return (
                      <button
                        key={grp}
                        onClick={() => setScheduleSearchQuery(isActive ? '' : grp)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all border ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                            : isLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            : 'bg-[#0e1015] text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Relocation & Multi-Select Action Panel */}
        {isMultiSelectMode && (
          <div className="p-4 bg-[#0d1017] border-b border-amber-500/40 text-white space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-amber-300">
                      Reubicación Múltiple en Bloque
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                      {selectedEntryIds.length} {selectedEntryIds.length === 1 ? 'clase seleccionada' : 'clases seleccionadas'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecciona clases en la tabla para moverlas juntas. Se verifican empalmes de docente y grupos en tiempo real.
                  </p>
                </div>
              </div>

              {/* Quick Select Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  Selección rápida:
                </span>
                {DAYS_OF_WEEK.map((d) => {
                  const dayCount = totalTeacherEntries.filter((e) => e.day === d).length;
                  if (dayCount === 0) return null;
                  const isFully = totalTeacherEntries
                    .filter((e) => e.day === d)
                    .every((e) => selectedEntryIds.includes(e.id));
                  return (
                    <button
                      key={d}
                      onClick={() => selectDayEntries(d)}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                        isFully
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {d} ({dayCount})
                    </button>
                  );
                })}
                <button
                  onClick={selectAllTeacherEntries}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                >
                  {selectedEntryIds.length === totalTeacherEntries.length && totalTeacherEntries.length > 0
                    ? 'Deseleccionar todo'
                    : 'Todo'}
                </button>
                {selectedEntryIds.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 rounded-md text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-800/60 transition-all cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setIsMultiSelectMode(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 cursor-pointer ml-1"
                  title="Cerrar modo selección múltiple"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedEntryIds.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center py-5">
                <div className="inline-flex p-2.5 rounded-full bg-amber-500/10 text-amber-400 mb-2">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-amber-300">
                  Ninguna clase seleccionada aún
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Haz clic sobre las tarjetas de clase en la tabla semanal o pulsa los botones de día arriba para elegirlas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Col 1: Selected classes preview (3 cols) */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      Clases elegidas ({selectedEntryIds.length}):
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {sortedSelectedEntries.map((e) => (
                      <div
                        key={e.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <div className="font-bold text-white truncate">
                            {e.subject}
                          </div>
                          <div className="text-[11px] text-amber-400 font-semibold">
                            Grupo {e.groupId} • {e.day} H{e.slot}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSelectEntry(e.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                          title="Quitar de selección"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Destination Config (4 cols) */}
                <div className="lg:col-span-4 space-y-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MoveRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Configurar Destino</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Modo de Reubicación:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setBulkMoveMode('change_day')}
                          className={`p-2 rounded-lg text-left text-xs font-bold border transition-all cursor-pointer ${
                            bulkMoveMode === 'change_day'
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          Cambiar de Día
                          <div className={`text-[10px] font-normal ${bulkMoveMode === 'change_day' ? 'text-slate-900' : 'text-slate-400'}`}>
                            Conserva horas actuales
                          </div>
                        </button>
                        <button
                          onClick={() => setBulkMoveMode('custom_day_slot')}
                          className={`p-2 rounded-lg text-left text-xs font-bold border transition-all cursor-pointer ${
                            bulkMoveMode === 'custom_day_slot'
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          Día y Horas Libres
                          <div className={`text-[10px] font-normal ${bulkMoveMode === 'custom_day_slot' ? 'text-slate-900' : 'text-slate-400'}`}>
                            Mover a nuevo bloque
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Day selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Día de destino:
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d}
                            onClick={() => setBulkTargetDay(d)}
                            className={`py-1.5 px-1 rounded-md font-bold text-xs transition-all border cursor-pointer ${
                              bulkTargetDay === d
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {d.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Slot selector if custom_day_slot */}
                    {bulkMoveMode === 'custom_day_slot' && (
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-semibold text-slate-400">
                          Hora de inicio destino:
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                            <button
                              key={s}
                              onClick={() => setBulkTargetStartSlot(s as TimeSlotId)}
                              className={`py-1 rounded text-xs font-black transition-all border cursor-pointer ${
                                bulkTargetStartSlot === s
                                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                              }`}
                            >
                              H{s}
                            </button>
                          ))}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={packConsecutive}
                            onChange={(e) => setPackConsecutive(e.target.checked)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
                          />
                          <span>Empaquetar horas en bloque continuo</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Conflict Status & Confirmation Action (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Status Banner */}
                  {bulkConflicts.length === 0 ? (
                    <div className="p-3 rounded-xl border bg-emerald-950/40 border-emerald-500/60 text-emerald-200">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-extrabold text-sm text-emerald-300 block">
                            ✓ 0 Conflictos Detectados
                          </span>
                          <p className="text-xs text-emerald-200/90 mt-0.5">
                            Docente y grupos están 100% disponibles en el nuevo horario.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border bg-rose-950/40 border-rose-500/70 text-rose-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                          <span className="font-extrabold text-xs sm:text-sm text-rose-300">
                            ⚠️ {bulkConflicts.length} Conflicto(s) Detectado(s)
                          </span>
                        </div>
                        <button
                          onClick={() => setShowConflictDetails(!showConflictDetails)}
                          className="text-[11px] text-rose-300 underline font-bold hover:text-white cursor-pointer"
                        >
                          {showConflictDetails ? 'Ocultar' : 'Ver detalles'}
                        </button>
                      </div>

                      <ul className="text-xs space-y-1 pl-4 list-disc text-rose-200/90 max-h-24 overflow-y-auto">
                        {bulkConflicts.slice(0, showConflictDetails ? bulkConflicts.length : 2).map((c, i) => (
                          <li key={i}>{c.message}</li>
                        ))}
                      </ul>

                      {conflictFreeAlternative && (
                        <div className="pt-2 border-t border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] text-amber-300 font-semibold leading-tight">
                            💡 Alternativa limpia: <span className="font-bold underline">{conflictFreeAlternative.description}</span>
                          </div>
                          <button
                            onClick={handleApplySuggestion}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black shrink-0 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Aplicar alternativa limpia</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Mapping List */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1 max-h-24 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Mapeo de Reubicación:
                    </span>
                    {proposedMoves.map((m, idx) => {
                      const hasConf = bulkConflicts.some(
                        (c) => c.entry.id === m.entry.id || (c.day === m.newDay && c.slot === m.newSlot)
                      );
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-0.5 text-[11px] border-b border-slate-800/50 last:border-b-0"
                        >
                          <span className="font-semibold text-slate-300 truncate max-w-[130px]">
                            {m.entry.subject} ({m.entry.groupId})
                          </span>
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <span className="text-slate-400">{m.originalDay.slice(0, 3)} H{m.originalSlot}</span>
                            <MoveRight className="w-2.5 h-2.5 text-slate-500" />
                            <span className={hasConf ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {m.newDay.slice(0, 3)} H{m.newSlot}
                            </span>
                            {hasConf ? (
                              <span className="text-rose-400 font-bold ml-1">✕</span>
                            ) : (
                              <span className="text-emerald-400 font-bold ml-1">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Confirm Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApplyBulkMove(false)}
                      disabled={proposedMoves.length === 0 || bulkConflicts.length > 0}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                        bulkConflicts.length === 0 && proposedMoves.length > 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 active:scale-98 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Reubicación ({selectedEntryIds.length})</span>
                    </button>

                    {bulkConflicts.length > 0 && (
                      <button
                        onClick={() => handleApplyBulkMove(true)}
                        title="Forzar reubicación a pesar de los empalmes"
                        className="py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-950/60 hover:bg-rose-900 border border-rose-700/80 text-rose-300 transition-all cursor-pointer"
                      >
                        Forzar con empalmes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3 Staggered Breaks Info Ribbon */}
        <div className="px-4 py-2.5 bg-[#0e1015] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            ☕ Recesos Escalonados de 20 min (Bloque 15:00 - 16:00 hrs):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 font-semibold text-[11px]">
              1º Grado: 15:00 - 15:20 (Clase 15:20 - 16:00)
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/60 text-sky-300 font-semibold text-[11px]">
              2º Grado: 15:20 - 15:40 • ✂️ Clase Dividida (20m antes / 20m después)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-semibold text-[11px]">
              3º Grado: 15:40 - 16:00 (Clase 15:00 - 15:40)
            </span>
          </div>
        </div>

        {/* VIEW 1: Mobile Day-Tabbed Cards View (optimized for mobile/tablet without zoom) */}
        {mobileLayoutMode === 'day_cards' ? (
          <div className="p-4 space-y-4">
            {/* Day Switcher Tabs with touch swipe */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none touch-manipulation">
              {DAYS_OF_WEEK.map((day) => {
                const dayHrs = teacherStats.hoursPerDay[day] || 0;
                const isActive = mobileActiveDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setMobileActiveDay(day)}
                    className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-center border transition-all cursor-pointer shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/20 ring-2 ring-amber-400/30'
                        : isLight
                        ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                        : 'bg-[#151821] text-slate-300 border-slate-800 hover:bg-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="text-xs font-black">{day}</div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                      {dayHrs} {dayHrs === 1 ? 'módulo' : 'módulos'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Daily Stacked Timeline Cards */}
            <div className="space-y-3">
              {timeSlots.map((slot) => {
                const matchingEntries = entries.filter(
                  (e) =>
                    e.day === mobileActiveDay &&
                    e.slot === slot.id &&
                    normalizeName(e.teacherName) === normalizeName(selectedTeacher)
                );

                const hasConflict =
                  matchingEntries.length > 1 ||
                  matchingEntries.some((e) =>
                    conflicts.some(
                      (c) =>
                        c.type === 'GROUP_OVERLAP' &&
                        c.day === mobileActiveDay &&
                        c.slot === slot.id &&
                        c.groupId?.trim().toUpperCase() === e.groupId.trim().toUpperCase()
                    )
                  );

                return (
                  <React.Fragment key={slot.id}>
                    {matchingEntries.length === 0 ? (
                      <div
                        onClick={() => onEditSlot(mobileActiveDay, slot.id, selectedTeacher)}
                        className={`p-3.5 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-between touch-manipulation active:scale-[0.99] ${
                          isLight
                            ? 'border-slate-300 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-400'
                            : 'border-slate-800/80 bg-[#12141c]/60 hover:bg-amber-500/5 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/50 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              Módulo {slot.id} • {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Módulo Libre / Disponible
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Asignar</span>
                        </button>
                      </div>
                    ) : (
                      matchingEntries.map((entry) => {
                        const subCfg = getSubjectConfig(entry.subject);
                        return (
                          <div
                            key={entry.id}
                            onClick={() => onEditSlot(mobileActiveDay, slot.id, selectedTeacher, entry.groupId)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden shadow-sm active:scale-[0.99] touch-manipulation ${
                              hasConflict
                                ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40'
                                : isLight
                                ? 'bg-white border-slate-200 hover:border-amber-400 shadow-slate-100'
                                : 'bg-[#151822] border-slate-800 hover:border-amber-500/60'
                            }`}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1.5"
                              style={{ backgroundColor: subCfg.badgeColor || '#f59e0b' }}
                            />
                            <div className="pl-2.5">
                              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>Módulo {slot.id} ({slot.startTime} - {slot.endTime})</span>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Grupo {entry.groupId}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-black text-slate-100">
                                    {entry.subject}
                                  </h4>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Docente: <strong className="text-slate-200">{selectedTeacher}</strong>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 shrink-0"
                                >
                                  Editar
                                </button>
                              </div>

                              {hasConflict && (
                                <div className="mt-2.5 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                  <span className="font-bold">¡Atención! Conflicto de horario en este módulo</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Staggered Recess Badge */}
                    {slot.isRecessAfter && (
                      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-center text-xs text-amber-300 font-bold flex items-center justify-center space-x-2">
                        <span>☕</span>
                        <span>{slot.recessLabel || 'Receso Escalonado (20 min) - 15:00 a 16:00 hrs'}</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 2: Full Weekly Table with horizontal scroll indicator */
          <div className="relative">
            {/* Visual scroll indicator for tablets and phones */}
            <div className="flex md:hidden items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                <span>↔</span>
                <span>Desliza horizontalmente para ver todos los días</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">5 Días • 35 Módulos</span>
            </div>

            <div className="overflow-x-auto touch-scroll">
              <table className="w-full border-collapse text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#16181f] border-b border-slate-800 text-slate-300 text-xs uppercase tracking-wider font-bold">
                <th className="p-3 w-32 text-center border-r border-slate-800">Hora / Módulo</th>
                {DAYS_OF_WEEK.map((day) => {
                  const dayEntries = totalTeacherEntries.filter((e) => e.day === day);
                  const isDayFullySelected =
                    dayEntries.length > 0 &&
                    dayEntries.every((e) => selectedEntryIds.includes(e.id));

                  return (
                    <th key={day} className="p-3 text-center border-r border-slate-800 last:border-r-0">
                      <div className="flex items-center justify-center gap-1.5">
                        {isMultiSelectMode && dayEntries.length > 0 && (
                          <button
                            onClick={() => selectDayEntries(day)}
                            title={isDayFullySelected ? `Deseleccionar todo el ${day}` : `Seleccionar todas las clases del ${day}`}
                            className="p-0.5 rounded hover:bg-slate-700/50 text-amber-400 transition-colors cursor-pointer"
                          >
                            {isDayFullySelected ? (
                              <CheckSquare className="w-3.5 h-3.5" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400" />
                            )}
                          </button>
                        )}
                        <span>{day}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal lowercase">
                        {teacherStats.hoursPerDay[day]} hrs asignadas
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {timeSlots.map((slot) => {
                return (
                  <React.Fragment key={slot.id}>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      {/* Time slot column */}
                      <td className="p-3 text-center bg-[#0e1015] border-r border-slate-800">
                        <div className="font-bold text-slate-200 text-xs">{slot.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </td>

                      {/* 5 Day Columns */}
                      {DAYS_OF_WEEK.map((day) => {
                        const matchingEntries = entries.filter(
                          (e) =>
                            e.day === day &&
                            e.slot === slot.id &&
                            normalizeName(e.teacherName) === normalizeName(selectedTeacher)
                        );

                        const hasTeacherOverlap = matchingEntries.length > 1;
                        const hasGroupOverlap = matchingEntries.some((e) =>
                          conflicts.some(
                            (c) =>
                              c.type === 'GROUP_OVERLAP' &&
                              c.day === day &&
                              c.slot === slot.id &&
                              c.groupId?.trim().toUpperCase() === e.groupId.trim().toUpperCase()
                          )
                        );
                        const hasConflict = hasTeacherOverlap || hasGroupOverlap;

                        if (matchingEntries.length === 0) {
                          // Free Slot
                          const isTargetStart =
                            isMultiSelectMode &&
                            bulkTargetDay === day &&
                            bulkTargetStartSlot === slot.id &&
                            (bulkMoveMode === 'custom_day_slot' || bulkMoveMode === 'change_slot');

                          const isPartOfProposedTarget =
                            isMultiSelectMode &&
                            proposedMoves.some((m) => m.newDay === day && m.newSlot === slot.id);

                          return (
                            <td
                              key={day}
                              onClick={() => {
                                if (isMultiSelectMode && selectedEntryIds.length > 0) {
                                  setBulkTargetDay(day);
                                  setBulkTargetStartSlot(slot.id);
                                  setBulkMoveMode('custom_day_slot');
                                  if (onShowToast) {
                                    onShowToast(`Destino fijado en ${day}, Hora ${slot.id}`, 'info');
                                  }
                                } else {
                                  onEditSlot(day, slot.id, selectedTeacher);
                                }
                              }}
                              className={`p-2 border-r border-slate-800/80 last:border-r-0 text-center align-middle hover:bg-amber-500/5 cursor-pointer group transition-all ${
                                isTargetStart
                                  ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/40'
                                  : isPartOfProposedTarget
                                  ? 'bg-teal-500/10 border border-dashed border-teal-400/50'
                                  : ''
                              } ${trimmedSearch ? 'opacity-30' : ''}`}
                            >
                              <div
                                className={`h-14 rounded-lg border border-dashed flex flex-col items-center justify-center transition-all ${
                                  isTargetStart
                                    ? 'border-amber-400 text-amber-300 bg-amber-500/10 font-bold'
                                    : isPartOfProposedTarget
                                    ? 'border-teal-400/70 text-teal-300 bg-teal-500/5 font-semibold'
                                    : 'border-slate-800 text-slate-600 group-hover:text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/5'
                                }`}
                              >
                                {isTargetStart ? (
                                  <>
                                    <span className="text-xs">🎯 Destino</span>
                                    <span className="text-[9px] font-mono text-amber-400">Inicio H{slot.id}</span>
                                  </>
                                ) : isPartOfProposedTarget ? (
                                  <>
                                    <span className="text-[10px] text-teal-300 font-bold">📥 Reubicar aquí</span>
                                    <span className="text-[9px] font-mono text-teal-400">Hora {slot.id}</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-amber-400">
                                      {isMultiSelectMode && selectedEntryIds.length > 0 ? 'Fijar destino' : 'Libre'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Check if any entry in this cell matches the search
                        const cellHasMatch = trimmedSearch
                          ? matchingEntries.some(
                              (e) =>
                                (e.subject || '').toLowerCase().includes(trimmedSearch) ||
                                (e.groupId || '').toLowerCase().includes(trimmedSearch) ||
                                (e.day || '').toLowerCase().includes(trimmedSearch)
                            )
                          : false;

                        const confObj = hasConflict
                          ? conflicts.find(
                              (c) =>
                                c.day === day &&
                                c.slot === slot.id &&
                                ((c.teacherName && normalizeName(c.teacherName) === normalizeName(selectedTeacher)) ||
                                  (c.groupId &&
                                    matchingEntries.some(
                                      (me) => me.groupId.trim().toUpperCase() === c.groupId?.trim().toUpperCase()
                                    )))
                            ) || {
                              id: `conf-teacher-${selectedTeacher}-${day}-${slot.id}`,
                              type: hasTeacherOverlap ? ('TEACHER_OVERLAP' as const) : ('GROUP_OVERLAP' as const),
                              day,
                              slot: slot.id,
                              teacherName: selectedTeacher,
                              groupId: matchingEntries[0]?.groupId,
                              description: `Empalme simultáneo de ${selectedTeacher} en ${day} H${slot.id}`,
                              affectedEntries: matchingEntries,
                              severity: 'error' as const,
                            }
                          : null;

                        // Has entry / multiple entries (conflict)
                        return (
                          <td
                            key={day}
                            onClick={(e) => {
                              if (isMultiSelectMode) {
                                e.stopPropagation();
                                if (matchingEntries.length === 1) {
                                  toggleSelectEntry(matchingEntries[0].id);
                                }
                              } else {
                                onEditSlot(day, slot.id, selectedTeacher);
                              }
                            }}
                            className={`p-2 border-r border-slate-800/80 last:border-r-0 align-middle cursor-pointer transition-all ${
                              hasConflict
                                ? isLight
                                  ? 'bg-rose-100 border-2 border-rose-500 ring-2 ring-rose-400 shadow-md shadow-rose-200'
                                  : 'bg-rose-950/70 border-2 border-rose-500 ring-2 ring-rose-500/80 shadow-lg shadow-rose-950/80'
                                : ''
                            } ${cellHasMatch ? 'bg-amber-500/5' : ''}`}
                          >
                            <div className="space-y-1.5">
                              {hasConflict && (
                                <div className="flex items-center justify-between gap-1 p-1 px-1.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase mb-1.5 shadow-xs">
                                  <span className="flex items-center gap-1 truncate">
                                    <AlertTriangle className="w-3 h-3 shrink-0 animate-bounce" />
                                    <span>
                                      {hasTeacherOverlap
                                        ? `¡Empalme! (${matchingEntries.length} clases)`
                                        : '¡Empalme en Grupo!'}
                                    </span>
                                  </span>
                                  {onSolveConflict && confObj && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSolveConflict(confObj);
                                      }}
                                      title="Resolver empalme de horario en este módulo"
                                      className="px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[9px] font-black flex items-center gap-0.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>Fix Conflict</span>
                                    </button>
                                  )}
                                </div>
                              )}
                              {matchingEntries.map((entry) => {
                                const isSelected = selectedEntryIds.includes(entry.id);
                                const subjectCfg = getSubjectConfig(entry.subject);
                                const bg = hasConflict
                                  ? (isLight ? '#ffe4e6' : 'rgba(159, 18, 57, 0.4)')
                                  : (isLight ? subjectCfg.bgLight : (subjectCfg.bgDark || subjectCfg.bgLight));
                                const border = hasConflict
                                  ? (isLight ? '#f43f5e' : 'rgba(244, 63, 94, 0.6)')
                                  : (isLight ? subjectCfg.borderColor : (subjectCfg.borderDark || subjectCfg.borderColor));
                                const textColor = hasConflict
                                  ? (isLight ? '#9f1239' : '#fca5a5')
                                  : (isLight ? subjectCfg.textColor : (subjectCfg.textDark || subjectCfg.textColor));

                                const isMatch = trimmedSearch
                                  ? (entry.subject || '').toLowerCase().includes(trimmedSearch) ||
                                    (entry.groupId || '').toLowerCase().includes(trimmedSearch) ||
                                    (entry.day || '').toLowerCase().includes(trimmedSearch)
                                  : false;

                                return (
                                  <div
                                    key={entry.id}
                                    onClick={(e) => {
                                      if (isMultiSelectMode) {
                                        e.stopPropagation();
                                        toggleSelectEntry(entry.id);
                                      }
                                    }}
                                    style={{
                                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.25)' : bg,
                                      borderColor: isSelected ? '#f59e0b' : isMatch ? '#f59e0b' : border,
                                      color: textColor,
                                    }}
                                    className={`p-2 rounded-lg border shadow-xs transition-all flex flex-col justify-between min-h-[56px] relative group ${
                                      isSelected
                                        ? 'ring-2 ring-amber-400 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02] z-20'
                                        : ''
                                    } ${
                                      trimmedSearch
                                        ? isMatch
                                          ? 'ring-2 ring-amber-400 shadow-md shadow-amber-500/20 scale-[1.02] z-10'
                                          : 'opacity-25 grayscale-[50%] hover:opacity-80 transition-opacity'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5">
                                        {isMultiSelectMode && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleSelectEntry(entry.id);
                                            }}
                                            className="text-amber-400 focus:outline-hidden cursor-pointer"
                                          >
                                            {isSelected ? (
                                              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                                            ) : (
                                              <Square className="w-3.5 h-3.5 text-slate-400 hover:text-amber-300" />
                                            )}
                                          </button>
                                        )}
                                        <span className="font-extrabold text-xs tracking-tight">
                                          Grupo {entry.groupId}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {isSelected && (
                                          <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-400 text-slate-950 rounded-xs shadow-xs uppercase">
                                            Elegida
                                          </span>
                                        )}
                                        {isMatch && !isSelected && (
                                          <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-500 text-slate-950 rounded-xs shadow-xs uppercase">
                                            Coincide
                                          </span>
                                        )}
                                        {hasConflict && (
                                          <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full animate-pulse">
                                            Empalme
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-[11px] font-bold truncate mt-0.5">
                                      {entry.subject}
                                    </div>

                                    {/* Slot 4 timing & split indicator */}
                                    {slot.id === 4 && (() => {
                                      const groupObj = groups.find(
                                        (g) => g.id.trim().toUpperCase() === entry.groupId.trim().toUpperCase()
                                      );
                                      const grade = groupObj?.grade || parseInt(entry.groupId.charAt(0), 10);
                                      if (grade === 2) {
                                        return (
                                          <div className="mt-1 text-[9px] font-bold leading-tight px-1 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                            ✂️ Dividida: 15:00-15:20 y 15:40-16:00
                                          </div>
                                        );
                                      }
                                      if (grade === 1) {
                                        return (
                                          <div className="mt-1 text-[9px] font-medium text-slate-300 opacity-90">
                                            15:20 - 16:00 (Receso previo)
                                          </div>
                                        );
                                      }
                                      if (grade === 3) {
                                        return (
                                          <div className="mt-1 text-[9px] font-medium text-slate-300 opacity-90">
                                            15:00 - 15:40 (Receso posterior)
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Recess row */}
                    {slot.isRecessAfter && (
                      <tr className="bg-amber-950/20 border-y border-amber-800/40">
                        <td
                          colSpan={6}
                          className="py-1 px-4 text-center text-[11px] font-bold text-amber-300 tracking-wider uppercase bg-amber-950/15"
                        >
                          {slot.recessLabel || '☕ Receso Escalonado (20 min)'}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>

      {/* Mass Notification Modal */}
      <MassNotificationModal
        isOpen={isMassNotifyModalOpen}
        onClose={() => setIsMassNotifyModalOpen(false)}
        allTeachers={allTeachers}
      />
    </div>
  );
};
