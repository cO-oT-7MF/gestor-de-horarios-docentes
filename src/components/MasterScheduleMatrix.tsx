import React, { useState, useEffect, useRef } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Conflict,
  Group,
  AcademicLoadItem,
  TimeSlotConfig,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import {
  getSubjectConfig,
  normalizeName,
  solveSingleConflict,
} from '../utils/scheduler';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Users,
  User,
  AlertTriangle,
  Sparkles,
  Move,
  ArrowRightLeft,
  RotateCcw,
  Check,
  X,
  GripVertical,
} from 'lucide-react';

interface MasterScheduleMatrixProps {
  entries: ScheduleEntry[];
  allTeachers: string[];
  groups: Group[];
  conflicts: Conflict[];
  academicLoads?: AcademicLoadItem[];
  timeSlots?: TimeSlotConfig[];
  onEditSlot: (day: DayOfWeek, slot: TimeSlotId, teacherName?: string, groupId?: string) => void;
  onSolveConflict?: (conflict: Conflict) => void;
  onSolveAllConflicts?: () => void;
  onUpdateEntries?: (newEntries: ScheduleEntry[]) => void;
}

interface DraggedItem {
  entry: ScheduleEntry;
  sourceDay: DayOfWeek;
  sourceSlot: TimeSlotId;
  sourceRowKey: string; // teacher name or group.id
  viewMode: 'teachers' | 'groups';
}

interface DragOverTarget {
  day: DayOfWeek;
  slot: TimeSlotId;
  rowKey: string;
}

export const MasterScheduleMatrix: React.FC<MasterScheduleMatrixProps> = ({
  entries,
  allTeachers,
  groups,
  conflicts,
  academicLoads = [],
  timeSlots = TIME_SLOTS,
  onEditSlot,
  onSolveConflict,
  onSolveAllConflicts,
  onUpdateEntries,
}) => {
  const { isLight } = useTheme();
  const [viewMode, setViewMode] = useState<'teachers' | 'groups'>('teachers');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyConflictsFilter, setOnlyConflictsFilter] = useState(false);

  // Automatically reset the "only conflicts" filter when all conflicts are resolved
  useEffect(() => {
    if (onlyConflictsFilter && conflicts.length === 0) {
      setOnlyConflictsFilter(false);
    }
  }, [conflicts.length, onlyConflictsFilter]);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(null);
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Undo stack
  const [undoStack, setUndoStack] = useState<ScheduleEntry[][]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'move' | 'swap' | 'undo';
    timestamp: number;
  } | null>(null);

  // Handle conflict fix button: resolves conflict, resets marked error badges and borders, and updates schedule
  const handleFixConflict = (conf: Conflict) => {
    // 1. Push current entries to undoStack
    setUndoStack((prev) => [...prev.slice(-15), entries]);

    // 2. Solve the conflict and update entries
    if (onUpdateEntries) {
      const res = solveSingleConflict(conf, entries, groups, academicLoads);
      if (res.success) {
        onUpdateEntries(res.newEntries);
        setToast({
          message: `✓ ${res.message} Marcas de error restablecidas.`,
          type: 'move',
          timestamp: Date.now(),
        });
      } else if (onSolveConflict) {
        onSolveConflict(conf);
        setToast({
          message: '✓ Empalme resuelto y marcas de error restablecidas.',
          type: 'move',
          timestamp: Date.now(),
        });
      }
    } else if (onSolveConflict) {
      onSolveConflict(conf);
      setToast({
        message: '✓ Empalme resuelto y marcas de error restablecidas.',
        type: 'move',
        timestamp: Date.now(),
      });
    }

    // 3. If filter "only conflicts" was active and this was the last conflict, reset filter
    if (onlyConflictsFilter && conflicts.length <= 1) {
      setOnlyConflictsFilter(false);
    }
  };

  const daysToShow: DayOfWeek[] = selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay];

  const teacherHasConflict = (teacherName: string) =>
    conflicts.some(
      (c) => c.teacherName && normalizeName(c.teacherName) === normalizeName(teacherName)
    );

  const groupHasConflict = (groupId: string) =>
    conflicts.some(
      (c) => c.groupId && c.groupId.trim().toUpperCase() === groupId.trim().toUpperCase()
    );

  // Filtered rows
  const filteredTeachers = allTeachers.filter((t) => {
    if (onlyConflictsFilter && !teacherHasConflict(t)) return false;
    if (searchTerm && !t.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredGroups = groups.filter((g) => {
    if (gradeFilter !== 'ALL' && g.grade !== gradeFilter) return false;
    if (onlyConflictsFilter && !groupHasConflict(g.id)) return false;
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Safe slot edit trigger (skips edit modal if click was part of a drag release)
  const handleSafeEditSlot = (
    day: DayOfWeek,
    slot: TimeSlotId,
    teacherName?: string,
    groupId?: string
  ) => {
    if (isDraggingRef.current) return;
    onEditSlot(day, slot, teacherName, groupId);
  };

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent,
    entry: ScheduleEntry,
    day: DayOfWeek,
    slot: TimeSlotId,
    rowKey: string,
    mode: 'teachers' | 'groups'
  ) => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    isDraggingRef.current = true;
    const itemData: DraggedItem = {
      entry,
      sourceDay: day,
      sourceSlot: slot,
      sourceRowKey: rowKey,
      viewMode: mode,
    };
    setDraggedItem(itemData);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({
          entryId: entry.id,
          day,
          slot,
          rowKey,
          mode,
        })
      );
    } catch {
      // Fallback
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 200);
  };

  const handleDropOnCell = (
    targetDay: DayOfWeek,
    targetSlot: TimeSlotId,
    targetRowKey: string
  ) => {
    if (!draggedItem) return;

    const {
      entry: draggedEntry,
      sourceDay,
      sourceSlot,
      sourceRowKey,
      viewMode: dragViewMode,
    } = draggedItem;

    // Check if dropping onto the exact same cell
    const isSameCell =
      sourceDay === targetDay &&
      sourceSlot === targetSlot &&
      (dragViewMode === 'teachers'
        ? normalizeName(sourceRowKey) === normalizeName(targetRowKey)
        : sourceRowKey.trim().toUpperCase() === targetRowKey.trim().toUpperCase());

    if (isSameCell) {
      setDraggedItem(null);
      setDragOverTarget(null);
      return;
    }

    if (dragViewMode === 'teachers') {
      const targetTeacher = targetRowKey;
      const sourceTeacher = sourceRowKey;

      const targetEntries = entries.filter(
        (e) =>
          e.day === targetDay &&
          e.slot === targetSlot &&
          normalizeName(e.teacherName) === normalizeName(targetTeacher)
      );

      let updatedEntries: ScheduleEntry[];
      let message = '';

      if (targetEntries.length === 0) {
        // Move to empty cell
        updatedEntries = entries.map((e) => {
          if (e.id === draggedEntry.id) {
            return {
              ...e,
              day: targetDay,
              slot: targetSlot,
              teacherName: targetTeacher,
            };
          }
          return e;
        });
        message = `Movida ${draggedEntry.subject} (${draggedEntry.groupId}) a ${targetDay} H${targetSlot}${
          normalizeName(targetTeacher) !== normalizeName(sourceTeacher) ? ` (Docente: ${targetTeacher})` : ''
        }`;
      } else {
        // Swap with the target entry
        const targetEntry = targetEntries[0];
        updatedEntries = entries.map((e) => {
          if (e.id === draggedEntry.id) {
            return {
              ...e,
              day: targetDay,
              slot: targetSlot,
              teacherName: targetTeacher,
            };
          }
          if (e.id === targetEntry.id) {
            return {
              ...e,
              day: sourceDay,
              slot: sourceSlot,
              teacherName: sourceTeacher,
            };
          }
          return e;
        });
        message = `Intercambiadas: ${draggedEntry.subject} (${draggedEntry.groupId}) ↔ ${targetEntry.subject} (${targetEntry.groupId})`;
      }

      setUndoStack((prev) => [...prev.slice(-15), entries]);
      onUpdateEntries?.(updatedEntries);
      setToast({
        message,
        type: targetEntries.length === 0 ? 'move' : 'swap',
        timestamp: Date.now(),
      });
    } else {
      // Group view
      const targetGroupId = targetRowKey;
      const sourceGroupId = sourceRowKey;

      const targetEntries = entries.filter(
        (e) =>
          e.day === targetDay &&
          e.slot === targetSlot &&
          e.groupId.trim().toUpperCase() === targetGroupId.trim().toUpperCase()
      );

      let updatedEntries: ScheduleEntry[];
      let message = '';

      if (targetEntries.length === 0) {
        // Move to empty cell
        updatedEntries = entries.map((e) => {
          if (e.id === draggedEntry.id) {
            return {
              ...e,
              day: targetDay,
              slot: targetSlot,
              groupId: targetGroupId,
            };
          }
          return e;
        });
        message = `Movida ${draggedEntry.subject} a ${targetDay} H${targetSlot} en Grupo ${targetGroupId}`;
      } else {
        // Swap with target entry
        const targetEntry = targetEntries[0];
        updatedEntries = entries.map((e) => {
          if (e.id === draggedEntry.id) {
            return {
              ...e,
              day: targetDay,
              slot: targetSlot,
              groupId: targetGroupId,
            };
          }
          if (e.id === targetEntry.id) {
            return {
              ...e,
              day: sourceDay,
              slot: sourceSlot,
              groupId: sourceGroupId,
            };
          }
          return e;
        });
        message = `Intercambiadas en Grupo ${targetGroupId}: ${draggedEntry.subject} ↔ ${targetEntry.subject}`;
      }

      setUndoStack((prev) => [...prev.slice(-15), entries]);
      onUpdateEntries?.(updatedEntries);
      setToast({
        message,
        type: targetEntries.length === 0 ? 'move' : 'swap',
        timestamp: Date.now(),
      });
    }

    setDraggedItem(null);
    setDragOverTarget(null);
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    onUpdateEntries?.(lastState);
    setToast({
      message: 'Movimiento deshecho. Estado del horario restaurado.',
      type: 'undo',
      timestamp: Date.now(),
    });
  };

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  // Auto dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-5 relative">
      {/* Controls & Filter Bar */}
      <div
        className={`rounded-xl border p-5 shadow-xl transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#111318] border-slate-800/90 shadow-black/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Mode Switch */}
          <div
            className={`flex items-center space-x-1.5 p-1.5 rounded-xl border self-start ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0c10] border-slate-800'
            }`}
          >
            <button
              onClick={() => setViewMode('teachers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                viewMode === 'teachers'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Sábana por Docentes ({allTeachers.length})</span>
            </button>
            <button
              onClick={() => setViewMode('groups')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                viewMode === 'groups'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sábana por Grupos ({groups.length})</span>
            </button>
          </div>

          {/* Conflict Resolver & Undo Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {undoStack.length > 0 && (
              <button
                onClick={handleUndo}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Deshacer el último arrastre (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Deshacer ({undoStack.length})</span>
              </button>
            )}

            {conflicts.length > 0 && onSolveAllConflicts && (
              <button
                onClick={onSolveAllConflicts}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Resolver Conflictos ({conflicts.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                placeholder={viewMode === 'teachers' ? 'Buscar docente...' : 'Buscar grupo...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-hidden transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                    : 'bg-[#0a0c10] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Day Filter */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedDay('ALL')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                  selectedDay === 'ALL'
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-[#0a0c10] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos los días
              </button>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2 py-1 text-xs rounded-lg font-bold border transition-all ${
                    selectedDay === day
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-[#0a0c10] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Grade Filter (Group View Only) */}
            {viewMode === 'groups' && (
              <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
                {(['ALL', 1, 2, 3] as const).map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setGradeFilter(grade)}
                    className={`px-2 py-1 text-xs rounded-lg font-bold border transition-all ${
                      gradeFilter === grade
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : isLight
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#0a0c10] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {grade === 'ALL' ? 'Todos Grados' : `${grade}º Grado`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conflict Highlighter Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setOnlyConflictsFilter((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                onlyConflictsFilter
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : conflicts.length > 0
                  ? isLight
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-rose-950/40 text-rose-300 border-rose-900/60 hover:bg-rose-900/50'
                  : isLight
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : 'bg-slate-800/40 text-slate-500 border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {onlyConflictsFilter
                  ? `Filtrando Solo con Empalmes (${conflicts.length})`
                  : `Ver Solo con Empalmes (${conflicts.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Drag and Drop Instructions Banner */}
        <div
          className={`mt-4 pt-3.5 border-t border-dashed flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight
              ? 'border-amber-200/80 bg-amber-50/60 text-amber-900 p-3 rounded-lg'
              : 'border-amber-900/40 bg-amber-950/20 text-amber-300 p-3 rounded-lg'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded bg-amber-500 text-slate-950 shrink-0">
              <Move className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-extrabold">Arrastrar y Soltar Habilitado:</span>{' '}
              <span className="opacity-90">
                Arrastra cualquier celda para mover una asignatura a otro módulo o día. Suéltala sobre otra materia para intercambiarlas automáticamente.
              </span>
            </div>
          </div>
          {draggedItem && (
            <div className="flex items-center space-x-2 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md text-[11px] font-black animate-pulse">
              <Move className="w-3 h-3" />
              <span>
                Arrastrando: {draggedItem.entry.subject} ({draggedItem.entry.groupId})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* The Master Grid Table */}
      <div
        className={`rounded-xl border shadow-xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#111318] border-slate-800/90 shadow-black/40'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr
                className={`border-b font-extrabold uppercase tracking-wider text-[11px] ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#0a0c10] text-slate-300 border-slate-800'
                }`}
              >
                <th className="p-3 sticky left-0 z-20 bg-inherit border-r border-slate-800 w-48 min-w-[190px]">
                  {viewMode === 'teachers' ? 'Docente / Asignatura' : 'Grupo / Asesor'}
                </th>
                {daysToShow.map((day) => (
                  <th
                    key={day}
                    colSpan={timeSlots.length}
                    className="p-2 text-center border-r-2 border-r-slate-700 border-b border-slate-800 bg-amber-500/10 text-amber-400 font-black tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
              <tr
                className={`border-b text-[10px] font-bold ${
                  isLight
                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                    : 'bg-[#0e1015] text-slate-400 border-slate-800'
                }`}
              >
                <th className="p-2 sticky left-0 z-20 bg-inherit border-r border-slate-800 text-[10px]">
                  Módulo Lectivo (40 min)
                </th>
                {daysToShow.map((day) =>
                  timeSlots.map((slot) => (
                    <th
                      key={`${day}-${slot.id}`}
                      className={`p-1.5 text-center border-r border-slate-800/80 font-mono ${
                        slot.id === 7 ? 'border-r-2 border-r-slate-700' : ''
                      }`}
                      title={`${slot.name} (${slot.startTime} - ${slot.endTime})`}
                    >
                      <div>M{slot.id}</div>
                      <div className="text-[9px] font-normal opacity-70">
                        {slot.startTime}
                      </div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody
              className={`divide-y text-xs ${
                isLight ? 'divide-slate-200' : 'divide-slate-800/80'
              }`}
            >
              {viewMode === 'teachers'
                ? filteredTeachers.map((teacher) => {
                    const hasTeacherOverlap = teacherHasConflict(teacher);
                    return (
                      <tr
                        key={teacher}
                        className={`transition-colors ${
                          hasTeacherOverlap
                            ? isLight
                              ? 'bg-rose-50/70 hover:bg-rose-100/70'
                              : 'bg-rose-950/20 hover:bg-rose-950/40'
                            : isLight
                            ? 'hover:bg-slate-50'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Sticky Teacher Name column */}
                        <td
                          className={`p-2.5 font-bold sticky left-0 z-10 border-r shadow-sm ${
                            isLight
                              ? 'bg-white text-slate-800 border-slate-200'
                              : 'bg-[#111318] text-slate-200 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-amber-500 truncate" title={teacher}>
                              {teacher}
                            </span>
                            {hasTeacherOverlap && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded animate-pulse">
                                EMPALME
                              </span>
                            )}
                          </div>
                        </td>

                        {daysToShow.map((day) =>
                          timeSlots.map((slot) => {
                            const matchingEntries = entries.filter(
                              (e) =>
                                e.day === day &&
                                e.slot === slot.id &&
                                normalizeName(e.teacherName) === normalizeName(teacher)
                            );

                            const isCellOver =
                              dragOverTarget?.day === day &&
                              dragOverTarget?.slot === slot.id &&
                              normalizeName(dragOverTarget?.rowKey || '') === normalizeName(teacher);

                            const isSourceCell =
                              draggedItem?.sourceDay === day &&
                              draggedItem?.sourceSlot === slot.id &&
                              normalizeName(draggedItem?.sourceRowKey || '') === normalizeName(teacher);

                            const hasTeacherOverlapInCell = matchingEntries.length > 1;
                            const hasGroupOverlapInCell = matchingEntries.some((e) =>
                              conflicts.some(
                                (c) =>
                                  c.type === 'GROUP_OVERLAP' &&
                                  c.day === day &&
                                  c.slot === slot.id &&
                                  c.groupId?.trim().toUpperCase() === e.groupId.trim().toUpperCase()
                              )
                            );
                            const hasConflict = hasTeacherOverlapInCell || hasGroupOverlapInCell;

                            if (matchingEntries.length === 0) {
                              return (
                                <td
                                  key={`${day}-${slot.id}`}
                                  onClick={() => handleSafeEditSlot(day, slot.id, teacher)}
                                  onDragOver={(e) => {
                                    if (!draggedItem) return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDragEnter={(e) => {
                                    if (!draggedItem) return;
                                    e.preventDefault();
                                    setDragOverTarget({ day, slot: slot.id, rowKey: teacher });
                                  }}
                                  onDragLeave={(e) => {
                                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                    if (isCellOver) setDragOverTarget(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnCell(day, slot.id, teacher);
                                  }}
                                  className={`p-1 text-center border-r border-slate-800/80 transition-all font-mono text-[10px] select-none ${
                                    isCellOver
                                      ? isLight
                                        ? 'bg-amber-100 border-2 border-dashed border-amber-500 ring-2 ring-amber-400/50 scale-[1.02] shadow-md z-10'
                                        : 'bg-amber-950/70 border-2 border-dashed border-amber-400 ring-2 ring-amber-500/50 scale-[1.02] shadow-md z-10'
                                      : draggedItem
                                      ? isLight
                                        ? 'bg-amber-50/40 border-dashed border-amber-300 hover:bg-amber-100/60'
                                        : 'bg-amber-950/10 border-dashed border-amber-800/40 hover:bg-amber-950/30'
                                      : isLight
                                      ? 'hover:bg-amber-500/10 cursor-pointer text-slate-400'
                                      : 'hover:bg-amber-500/5 cursor-pointer text-slate-600'
                                  } ${slot.id === 7 ? 'border-r-2 border-r-slate-700' : ''}`}
                                >
                                  {isCellOver ? (
                                    <div className="flex flex-col items-center justify-center py-0.5 text-amber-500 font-bold text-[9px] animate-pulse">
                                      <Move className="w-3 h-3 mb-0.5" />
                                      <span>Mover</span>
                                    </div>
                                  ) : draggedItem ? (
                                    <span className="text-amber-500/50 font-bold">+</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              );
                            }

                            const confObj = hasConflict
                              ? conflicts.find(
                                  (c) =>
                                    c.day === day &&
                                    c.slot === slot.id &&
                                    ((c.teacherName && normalizeName(c.teacherName) === normalizeName(teacher)) ||
                                      (c.groupId &&
                                        matchingEntries.some(
                                          (me) => me.groupId.trim().toUpperCase() === c.groupId?.trim().toUpperCase()
                                        )))
                                ) || {
                                  id: `conf-teacher-${day}-${slot.id}`,
                                  type: hasTeacherOverlapInCell ? ('TEACHER_OVERLAP' as const) : ('GROUP_OVERLAP' as const),
                                  day,
                                  slot: slot.id,
                                  teacherName: teacher,
                                  groupId: matchingEntries[0].groupId,
                                  description: `Empalme simultáneo de ${teacher} en ${day} H${slot.id}`,
                                  affectedEntries: matchingEntries,
                                  severity: 'error' as const,
                                }
                              : null;

                            return (
                              <td
                                key={`${day}-${slot.id}`}
                                onClick={() => handleSafeEditSlot(day, slot.id, teacher)}
                                onDragOver={(e) => {
                                  if (!draggedItem) return;
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                }}
                                onDragEnter={(e) => {
                                  if (!draggedItem) return;
                                  e.preventDefault();
                                  setDragOverTarget({ day, slot: slot.id, rowKey: teacher });
                                }}
                                onDragLeave={(e) => {
                                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                  if (isCellOver) setDragOverTarget(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDropOnCell(day, slot.id, teacher);
                                }}
                                className={`p-1 border-r border-slate-800/80 cursor-pointer transition-all relative ${
                                  isCellOver && !isSourceCell
                                    ? isLight
                                      ? 'bg-sky-100 border-2 border-dashed border-sky-500 ring-2 ring-sky-400/70 scale-[1.02] shadow-lg z-10'
                                      : 'bg-sky-950/70 border-2 border-dashed border-sky-400 ring-2 ring-sky-500/70 scale-[1.02] shadow-lg z-10'
                                    : hasConflict
                                    ? isLight
                                      ? 'bg-rose-100 border-2 border-rose-600 ring-2 ring-rose-400/90 shadow-sm'
                                      : 'bg-rose-950/70 border-2 border-rose-500 ring-2 ring-rose-500/80 shadow-md shadow-rose-950/70'
                                    : ''
                                } ${slot.id === 7 ? 'border-r-2 border-r-slate-700' : ''}`}
                              >
                                {/* Swap indicator badge on hover */}
                                {isCellOver && !isSourceCell && (
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 bg-sky-500 text-white rounded-full text-[8px] font-black shadow-md flex items-center space-x-1 whitespace-nowrap animate-bounce">
                                    <ArrowRightLeft className="w-2.5 h-2.5" />
                                    <span>Intercambiar</span>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  {matchingEntries.map((entry) => {
                                    const cfg = getSubjectConfig(entry.subject);
                                    const isBeingDragged = draggedItem?.entry.id === entry.id;

                                    const bg = hasConflict
                                      ? isLight
                                        ? '#ffe4e6'
                                        : 'rgba(159, 18, 57, 0.45)'
                                      : isLight
                                      ? cfg.bgLight
                                      : cfg.bgDark || cfg.bgLight;

                                    const border = hasConflict
                                      ? isLight
                                        ? '#f43f5e'
                                        : 'rgba(244, 63, 94, 0.7)'
                                      : isLight
                                      ? cfg.borderColor
                                      : cfg.borderDark || cfg.borderColor;

                                    const textColor = hasConflict
                                      ? isLight
                                        ? '#9f1239'
                                        : '#fca5a5'
                                      : isLight
                                      ? cfg.textColor
                                      : cfg.textDark || cfg.textColor;

                                    return (
                                      <div
                                        key={entry.id}
                                        draggable
                                        onDragStart={(e) =>
                                          handleDragStart(e, entry, day, slot.id, teacher, 'teachers')
                                        }
                                        onDragEnd={handleDragEnd}
                                        style={{
                                          backgroundColor: bg,
                                          borderColor: border,
                                          color: textColor,
                                        }}
                                        className={`group relative px-1.5 py-1 rounded border text-center font-bold text-[11px] leading-tight flex flex-col justify-center min-w-[65px] transition-all select-none cursor-grab active:cursor-grabbing ${
                                          isBeingDragged
                                            ? 'opacity-30 scale-95 ring-2 ring-amber-500 shadow-inner'
                                            : 'hover:shadow-md hover:scale-[1.02]'
                                        }`}
                                        title={`Arrastra para mover "${entry.subject}" a otro horario/día o soltar sobre otra materia`}
                                      >
                                        <div className="flex items-center justify-between gap-0.5">
                                          <span className="font-extrabold truncate">{entry.groupId}</span>
                                          <GripVertical className="w-2.5 h-2.5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                        <span className="text-[9px] font-normal truncate opacity-90">
                                          {cfg.shortName || entry.subject}
                                        </span>
                                      </div>
                                    );
                                  })}

                                  {hasConflict && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5">
                                      <span className="text-[8px] font-black bg-rose-600 text-white rounded px-1 animate-pulse">
                                        {matchingEntries.length > 1 ? `+${matchingEntries.length - 1} ` : ''}EMPALME
                                      </span>
                                      {onSolveConflict && confObj && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFixConflict(confObj);
                                          }}
                                          title="Resolver empalme de hora y restablecer marcas de error"
                                          className="text-[8px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-1.5 py-0.2 rounded shadow-xs active:scale-90 cursor-pointer"
                                        >
                                          Fix
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })
                : filteredGroups.map((group) => {
                    const hasGrpConflict = groupHasConflict(group.id);
                    return (
                      <tr
                        key={group.id}
                        className={`transition-colors ${
                          hasGrpConflict
                            ? isLight
                              ? 'bg-rose-50/70 hover:bg-rose-100/70'
                              : 'bg-rose-950/20 hover:bg-rose-950/40'
                            : isLight
                            ? 'hover:bg-slate-50'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Sticky Group Name column */}
                        <td
                          className={`p-2.5 font-bold sticky left-0 z-10 border-r shadow-sm ${
                            isLight
                              ? 'bg-white text-slate-800 border-slate-200'
                              : 'bg-[#111318] text-slate-200 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div>
                              <div className="font-extrabold text-amber-500">Grupo {group.name}</div>
                              <div className="text-[10px] opacity-75">Asesor: {group.advisor || 'N/A'}</div>
                            </div>
                            {hasGrpConflict && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded animate-pulse">
                                EMPALME
                              </span>
                            )}
                          </div>
                        </td>

                        {daysToShow.map((day) =>
                          timeSlots.map((slot) => {
                            const matchingEntries = entries.filter(
                              (e) =>
                                e.day === day &&
                                e.slot === slot.id &&
                                e.groupId.trim().toUpperCase() === group.id.trim().toUpperCase()
                            );

                            const isCellOver =
                              dragOverTarget?.day === day &&
                              dragOverTarget?.slot === slot.id &&
                              dragOverTarget?.rowKey.trim().toUpperCase() === group.id.trim().toUpperCase();

                            const isSourceCell =
                              draggedItem?.sourceDay === day &&
                              draggedItem?.sourceSlot === slot.id &&
                              draggedItem?.sourceRowKey.trim().toUpperCase() === group.id.trim().toUpperCase();

                            const hasGroupOverlapInCell = matchingEntries.length > 1;
                            const hasTeacherOverlapInCell = matchingEntries.some((e) =>
                              e.teacherName &&
                              conflicts.some(
                                (c) =>
                                  c.type === 'TEACHER_OVERLAP' &&
                                  c.day === day &&
                                  c.slot === slot.id &&
                                  normalizeName(c.teacherName) === normalizeName(e.teacherName)
                              )
                            );
                            const hasConflict = hasGroupOverlapInCell || hasTeacherOverlapInCell;

                            if (matchingEntries.length === 0) {
                              return (
                                <td
                                  key={`${day}-${slot.id}`}
                                  onClick={() => handleSafeEditSlot(day, slot.id, undefined, group.id)}
                                  onDragOver={(e) => {
                                    if (!draggedItem) return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                  }}
                                  onDragEnter={(e) => {
                                    if (!draggedItem) return;
                                    e.preventDefault();
                                    setDragOverTarget({ day, slot: slot.id, rowKey: group.id });
                                  }}
                                  onDragLeave={(e) => {
                                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                    if (isCellOver) setDragOverTarget(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnCell(day, slot.id, group.id);
                                  }}
                                  className={`p-1 text-center border-r border-slate-800/80 transition-all font-mono text-[10px] select-none ${
                                    isCellOver
                                      ? isLight
                                        ? 'bg-amber-100 border-2 border-dashed border-amber-500 ring-2 ring-amber-400/50 scale-[1.02] shadow-md z-10'
                                        : 'bg-amber-950/70 border-2 border-dashed border-amber-400 ring-2 ring-amber-500/50 scale-[1.02] shadow-md z-10'
                                      : draggedItem
                                      ? isLight
                                        ? 'bg-amber-50/40 border-dashed border-amber-300 hover:bg-amber-100/60'
                                        : 'bg-amber-950/10 border-dashed border-amber-800/40 hover:bg-amber-950/30'
                                      : isLight
                                      ? 'hover:bg-amber-500/10 cursor-pointer text-slate-400'
                                      : 'hover:bg-amber-500/5 cursor-pointer text-slate-600'
                                  } ${slot.id === 7 ? 'border-r-2 border-r-slate-700' : ''}`}
                                >
                                  {isCellOver ? (
                                    <div className="flex flex-col items-center justify-center py-0.5 text-amber-500 font-bold text-[9px] animate-pulse">
                                      <Move className="w-3 h-3 mb-0.5" />
                                      <span>Mover</span>
                                    </div>
                                  ) : draggedItem ? (
                                    <span className="text-amber-500/50 font-bold">+</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              );
                            }

                            const confObj = hasConflict
                              ? conflicts.find(
                                  (c) =>
                                    c.day === day &&
                                    c.slot === slot.id &&
                                    ((c.groupId && c.groupId.trim().toUpperCase() === group.id.trim().toUpperCase()) ||
                                      (c.teacherName &&
                                        matchingEntries.some(
                                          (me) => normalizeName(me.teacherName) === normalizeName(c.teacherName)
                                        )))
                                ) || {
                                  id: `conf-group-${day}-${slot.id}`,
                                  type: hasGroupOverlapInCell ? ('GROUP_OVERLAP' as const) : ('TEACHER_OVERLAP' as const),
                                  day,
                                  slot: slot.id,
                                  groupId: group.id,
                                  teacherName: matchingEntries[0].teacherName,
                                  description: `Empalme en Grupo ${group.name} en ${day} H${slot.id}`,
                                  affectedEntries: matchingEntries,
                                  severity: 'error' as const,
                                }
                              : null;

                            return (
                              <td
                                key={`${day}-${slot.id}`}
                                onClick={() => handleSafeEditSlot(day, slot.id, undefined, group.id)}
                                onDragOver={(e) => {
                                  if (!draggedItem) return;
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                }}
                                onDragEnter={(e) => {
                                  if (!draggedItem) return;
                                  e.preventDefault();
                                  setDragOverTarget({ day, slot: slot.id, rowKey: group.id });
                                }}
                                onDragLeave={(e) => {
                                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                  if (isCellOver) setDragOverTarget(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDropOnCell(day, slot.id, group.id);
                                }}
                                className={`p-1 border-r border-slate-800/80 cursor-pointer transition-all relative ${
                                  isCellOver && !isSourceCell
                                    ? isLight
                                      ? 'bg-sky-100 border-2 border-dashed border-sky-500 ring-2 ring-sky-400/70 scale-[1.02] shadow-lg z-10'
                                      : 'bg-sky-950/70 border-2 border-dashed border-sky-400 ring-2 ring-sky-500/70 scale-[1.02] shadow-lg z-10'
                                    : hasConflict
                                    ? isLight
                                      ? 'bg-rose-100 border-2 border-rose-600 ring-2 ring-rose-400/90 shadow-sm'
                                      : 'bg-rose-950/70 border-2 border-rose-500 ring-2 ring-rose-500/80 shadow-md shadow-rose-950/70'
                                    : ''
                                } ${slot.id === 7 ? 'border-r-2 border-r-slate-700' : ''}`}
                              >
                                {/* Swap indicator badge on hover */}
                                {isCellOver && !isSourceCell && (
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 bg-sky-500 text-white rounded-full text-[8px] font-black shadow-md flex items-center space-x-1 whitespace-nowrap animate-bounce">
                                    <ArrowRightLeft className="w-2.5 h-2.5" />
                                    <span>Intercambiar</span>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  {matchingEntries.map((entry) => {
                                    const cfg = getSubjectConfig(entry.subject);
                                    const isBeingDragged = draggedItem?.entry.id === entry.id;

                                    const bg = hasConflict
                                      ? isLight
                                        ? '#ffe4e6'
                                        : 'rgba(159, 18, 57, 0.45)'
                                      : isLight
                                      ? cfg.bgLight
                                      : cfg.bgDark || cfg.bgLight;

                                    const border = hasConflict
                                      ? isLight
                                        ? '#f43f5e'
                                        : 'rgba(244, 63, 94, 0.7)'
                                      : isLight
                                      ? cfg.borderColor
                                      : cfg.borderDark || cfg.borderColor;

                                    const textColor = hasConflict
                                      ? isLight
                                        ? '#9f1239'
                                        : '#fca5a5'
                                      : isLight
                                      ? cfg.textColor
                                      : cfg.textDark || cfg.textColor;

                                    return (
                                      <div
                                        key={entry.id}
                                        draggable
                                        onDragStart={(e) =>
                                          handleDragStart(e, entry, day, slot.id, group.id, 'groups')
                                        }
                                        onDragEnd={handleDragEnd}
                                        style={{
                                          backgroundColor: bg,
                                          borderColor: border,
                                          color: textColor,
                                        }}
                                        className={`group relative px-1.5 py-1 rounded border text-center font-bold text-[11px] leading-tight flex flex-col justify-center min-w-[70px] transition-all select-none cursor-grab active:cursor-grabbing ${
                                          isBeingDragged
                                            ? 'opacity-30 scale-95 ring-2 ring-amber-500 shadow-inner'
                                            : 'hover:shadow-md hover:scale-[1.02]'
                                        }`}
                                        title={`Arrastra para mover "${entry.subject}" a otro horario/día o soltar sobre otra materia`}
                                      >
                                        <div className="flex items-center justify-between gap-0.5">
                                          <span className="truncate font-extrabold">
                                            {cfg.shortName || entry.subject}
                                          </span>
                                          <GripVertical className="w-2.5 h-2.5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                        <span className="text-[9px] font-normal truncate opacity-90">
                                          {entry.teacherName}
                                        </span>
                                      </div>
                                    );
                                  })}

                                  {hasConflict && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5">
                                      <span className="text-[8px] font-black bg-rose-600 text-white rounded px-1 animate-pulse">
                                        {hasGroupOverlapInCell ? 'EMPALME GRUPO' : 'EMPALME DOCENTE'}
                                      </span>
                                      {onSolveConflict && confObj && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFixConflict(confObj);
                                          }}
                                          title="Resolver empalme de hora y restablecer marcas de error"
                                          className="text-[8px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-1.5 py-0.2 rounded shadow-xs active:scale-90 cursor-pointer"
                                        >
                                          Fix
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Drag & Drop Action Toast / Undo Bar */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 shadow-slate-400/50'
              : 'bg-[#14171f] border-slate-700 text-slate-100 shadow-black/80'
          }`}
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs max-w-sm">
            <p className="font-bold leading-tight">{toast.message}</p>
            <p className="text-[10px] opacity-70 mt-0.5">
              Horario y estado actualizados automáticamente
            </p>
          </div>
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="ml-2 px-2.5 py-1 text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Deshacer
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
