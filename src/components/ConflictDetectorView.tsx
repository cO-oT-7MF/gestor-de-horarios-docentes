import React, { useState, useMemo } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Conflict,
  Group,
  AcademicLoadItem,
} from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Clock,
  Zap,
  PlusCircle,
  MinusCircle,
  UserX,
  AlertCircle,
  Filter,
  Check,
  Wrench,
} from 'lucide-react';
import {
  solveSingleConflict,
  solveAllConflicts,
  solveTeacherOverlaps,
} from '../utils/scheduler';
import { useTheme } from '../context/ThemeContext';
import confetti from 'canvas-confetti';

interface ConflictDetectorViewProps {
  conflicts: Conflict[];
  entries: ScheduleEntry[];
  setEntries: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  groups: Group[];
  academicLoads: AcademicLoadItem[];
  onEditSlot: (day: DayOfWeek, slot: TimeSlotId, teacherName?: string, groupId?: string) => void;
  onSolveConflict?: (conflict: Conflict) => void;
  onSolveAllConflicts?: () => void;
}

type ConflictCategory = 'all' | 'teacher' | 'group' | 'unassigned' | 'overassigned';

export const ConflictDetectorView: React.FC<ConflictDetectorViewProps> = ({
  conflicts,
  entries,
  setEntries,
  groups,
  academicLoads,
  onEditSlot,
  onSolveConflict,
  onSolveAllConflicts,
}) => {
  const { isLight } = useTheme();
  const [autoSolving, setAutoSolving] = useState(false);
  const [solvingConflictId, setSolvingConflictId] = useState<string | null>(null);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [solveLog, setSolveLog] = useState<string[] | null>(null);
  const [lastActionResult, setLastActionResult] = useState<{ message: string; success: boolean } | null>(null);
  const [activeCategory, setActiveCategory] = useState<ConflictCategory>('all');

  const teacherOverlaps = conflicts.filter((c) => c.type === 'TEACHER_OVERLAP');
  const groupOverlaps = conflicts.filter((c) => c.type === 'GROUP_OVERLAP');
  const unassignedHours = conflicts.filter(
    (c) => c.type === 'UNASSIGNED_HOURS' || (c.type === 'HOURS_MISMATCH' && (c.difference || 0) < 0)
  );
  const overassignedHours = conflicts.filter(
    (c) => c.type === 'OVERASSIGNED_HOURS' || (c.type === 'HOURS_MISMATCH' && (c.difference || 0) > 0)
  );

  const totalConflictsCount = conflicts.length;

  // Track the active selected conflict across user clicks and categories
  const selectedConflict = useMemo(() => {
    if (selectedConflictId) {
      const found = conflicts.find((c) => c.id === selectedConflictId);
      if (found) return found;
    }
    if (activeCategory === 'teacher' && teacherOverlaps.length > 0) return teacherOverlaps[0];
    if (activeCategory === 'group' && groupOverlaps.length > 0) return groupOverlaps[0];
    if (activeCategory === 'unassigned' && unassignedHours.length > 0) return unassignedHours[0];
    if (activeCategory === 'overassigned' && overassignedHours.length > 0) return overassignedHours[0];
    return conflicts.length > 0 ? conflicts[0] : null;
  }, [conflicts, selectedConflictId, activeCategory, teacherOverlaps, groupOverlaps, unassignedHours, overassignedHours]);

  // Targeted Single Conflict Auto-Fix Handler:
  // Resolves ONLY the specific conflict selected without triggering full schedule regeneration
  const handleSolveSingle = (conflict: Conflict) => {
    setSolvingConflictId(conflict.id);
    setSelectedConflictId(conflict.id);
    setLastActionResult(null);

    setTimeout(() => {
      let result: { newEntries: ScheduleEntry[]; success: boolean; message: string };

      if (onSolveConflict) {
        const customRes = onSolveConflict(conflict) as any;
        if (customRes && typeof customRes === 'object' && 'newEntries' in customRes) {
          result = customRes;
        } else {
          result = solveSingleConflict(conflict, entries, groups, academicLoads);
          if (result.success) {
            setEntries(result.newEntries);
          }
        }
      } else {
        result = solveSingleConflict(conflict, entries, groups, academicLoads);
        if (result.success) {
          setEntries(result.newEntries);
        }
      }

      if (result.success) {
        setLastActionResult({
          message: `✓ Auto-Fix exitoso: ${result.message}`,
          success: true,
        });
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // Safe fallback
        }
      } else {
        setLastActionResult({
          message: `No se pudo auto-reparar automáticamente: ${result.message}`,
          success: false,
        });
      }
      setSolvingConflictId(null);
    }, 250);
  };

  // Solve All Conflicts Handler
  const handleSolveAll = () => {
    setAutoSolving(true);
    setLastActionResult(null);

    setTimeout(() => {
      if (onSolveAllConflicts) {
        onSolveAllConflicts();
        setAutoSolving(false);
        return;
      }

      const { newEntries, resolvedCount, actionLog } = solveAllConflicts(
        conflicts,
        entries,
        groups,
        academicLoads
      );

      setEntries(newEntries);
      setSolveLog(actionLog);
      setAutoSolving(false);

      if (resolvedCount > 0) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
        setLastActionResult({
          message: `Se resolvieron ${resolvedCount} conflicto(s) exitosamente.`,
          success: true,
        });
      } else {
        setLastActionResult({
          message: 'No se encontraron más conflictos para resolver automáticamente.',
          success: false,
        });
      }
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {/* Overview Card */}
      <div
        className={`rounded-xl border p-6 shadow-xl transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#111318] border-slate-800/90 shadow-black/40'
        }`}
      >
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Auditoría Integral y Corrector de Conflictos</span>
            </div>
            <h1
              className={`text-xl font-black font-serif tracking-tight ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              Detector y Corrector Automático de Horarios
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Detecta y resuelve de forma instantánea horas no asignadas, sobre-asignadas y empalmes simultáneos entre docentes y grupos.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {totalConflictsCount > 0 && (
              <button
                onClick={handleSolveAll}
                disabled={autoSolving}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-lg text-xs sm:text-sm font-black hover:brightness-105 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {autoSolving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-slate-950" />
                )}
                <span>Resolver Todos los Conflictos ({totalConflictsCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Teacher Overlaps */}
          <div
            onClick={() => setActiveCategory('teacher')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
              teacherOverlaps.length > 0
                ? isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            } ${activeCategory === 'teacher' ? 'ring-2 ring-rose-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Empalmes Docente
              </span>
              {teacherOverlaps.length === 0 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-black mt-1">{teacherOverlaps.length}</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              {teacherOverlaps.length === 0
                ? '0 choques de hora'
                : 'Mismo docente en 2 grupos'}
            </div>
          </div>

          {/* Group Overlaps */}
          <div
            onClick={() => setActiveCategory('group')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
              groupOverlaps.length > 0
                ? isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            } ${activeCategory === 'group' ? 'ring-2 ring-amber-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Empalmes Grupo
              </span>
              {groupOverlaps.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Layers className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="text-2xl font-black mt-1">{groupOverlaps.length}</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              {groupOverlaps.length === 0
                ? '1 clase por periodo'
                : '2 materias en misma hora'}
            </div>
          </div>

          {/* Unassigned Hours */}
          <div
            onClick={() => setActiveCategory('unassigned')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
              unassignedHours.length > 0
                ? isLight
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : 'bg-orange-950/40 border-orange-800/60 text-orange-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            } ${activeCategory === 'unassigned' ? 'ring-2 ring-orange-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Horas Faltantes
              </span>
              {unassignedHours.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <PlusCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <div className="text-2xl font-black mt-1">{unassignedHours.length}</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              {unassignedHours.length === 0
                ? 'Carga completa'
                : 'Materias con horas sin asignar'}
            </div>
          </div>

          {/* Overassigned Hours */}
          <div
            onClick={() => setActiveCategory('overassigned')}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
              overassignedHours.length > 0
                ? isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-900'
                  : 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                : isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            } ${activeCategory === 'overassigned' ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Horas Excedentes
              </span>
              {overassignedHours.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <MinusCircle className="w-5 h-5 text-purple-500" />
              )}
            </div>
            <div className="text-2xl font-black mt-1">{overassignedHours.length}</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              {overassignedHours.length === 0
                ? 'Horas exactas'
                : 'Sobre-asignación en grupos'}
            </div>
          </div>
        </div>

        {/* Action Result Notification Banner */}
        {lastActionResult && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
              lastActionResult.success
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                : isLight
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-amber-950/50 border-amber-700/60 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{lastActionResult.message}</span>
            </div>
            <button
              onClick={() => setLastActionResult(null)}
              className="text-xs opacity-70 hover:opacity-100 underline ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Auto Solve Action Log */}
        {solveLog && solveLog.length > 0 && (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              isLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Historial de Ajustes Automáticos Aplicados:</span>
            </div>
            <ul className="text-xs space-y-1 list-disc pl-5">
              {solveLog.map((log, i) => (
                <li key={i}>{log}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
              : isLight
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              : 'bg-[#141720] text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Todos los Conflictos ({totalConflictsCount})
        </button>
        <button
          onClick={() => setActiveCategory('teacher')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === 'teacher'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : isLight
              ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              : 'bg-[#141720] text-rose-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Empalmes de Docentes ({teacherOverlaps.length})
        </button>
        <button
          onClick={() => setActiveCategory('group')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === 'group'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : isLight
              ? 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              : 'bg-[#141720] text-amber-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Empalmes de Grupo ({groupOverlaps.length})
        </button>
        <button
          onClick={() => setActiveCategory('unassigned')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === 'unassigned'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : isLight
              ? 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'
              : 'bg-[#141720] text-orange-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Horas Sin Asignar ({unassignedHours.length})
        </button>
        <button
          onClick={() => setActiveCategory('overassigned')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeCategory === 'overassigned'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : isLight
              ? 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
              : 'bg-[#141720] text-purple-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          Horas Sobre-Asignadas ({overassignedHours.length})
        </button>
      </div>

      {/* Auto-Fix Selected Conflict Action Banner */}
      {totalConflictsCount > 0 && selectedConflict && (
        <div
          className={`p-4 sm:p-5 rounded-xl border shadow-lg transition-all ${
            isLight
              ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-amber-100/30'
              : 'bg-[#151722] border-amber-500/40 text-slate-100 shadow-black/50'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Conflicto Seleccionado</span>
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    selectedConflict.type === 'TEACHER_OVERLAP'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : selectedConflict.type === 'GROUP_OVERLAP'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : selectedConflict.type === 'UNASSIGNED_HOURS'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {selectedConflict.type === 'TEACHER_OVERLAP' && 'Empalme de Docente'}
                  {selectedConflict.type === 'GROUP_OVERLAP' && 'Empalme de Grupo'}
                  {selectedConflict.type === 'UNASSIGNED_HOURS' && 'Horas Sin Asignar'}
                  {selectedConflict.type === 'OVERASSIGNED_HOURS' && 'Horas Sobre-Asignadas'}
                  {selectedConflict.type === 'HOURS_MISMATCH' && 'Discrepancia Horaria'}
                </span>
                {selectedConflict.day && selectedConflict.slot && (
                  <span className={`text-xs px-2 py-0.5 rounded font-bold border ${isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {selectedConflict.day} • Hora {selectedConflict.slot}
                  </span>
                )}
                {selectedConflict.groupId && (
                  <span className={`text-xs px-2 py-0.5 rounded font-bold border ${isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    Grupo {selectedConflict.groupId}
                  </span>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-black truncate">
                {selectedConflict.teacherName ? `Prof(a). ${selectedConflict.teacherName}` : ''}
                {selectedConflict.subject ? ` — ${selectedConflict.subject}` : ''}
              </h3>

              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selectedConflict.description}
              </p>

              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                <span>⚡ Auto-Fix resuelve exclusivamente este conflicto puntual sin regenerar todo el horario ni mover las demás asignaciones.</span>
              </p>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0 self-start lg:self-center">
              <button
                type="button"
                id="conflict-auto-fix-selected-btn"
                onClick={() => handleSolveSingle(selectedConflict)}
                disabled={solvingConflictId === selectedConflict.id || autoSolving}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Auto-Fix: Resolver únicamente este conflicto seleccionado sin regenerar el horario completo"
              >
                {solvingConflictId === selectedConflict.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                )}
                <span>Auto-Fix</span>
              </button>

              {selectedConflict.day && selectedConflict.slot && (
                <button
                  type="button"
                  onClick={() =>
                    selectedConflict.day &&
                    selectedConflict.slot &&
                    onEditSlot(
                      selectedConflict.day,
                      selectedConflict.slot,
                      selectedConflict.teacherName,
                      selectedConflict.groupId
                    )
                  }
                  className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-colors border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Editar manualmente este bloque horario"
                >
                  <span>Editar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Teacher Overlaps Section */}
      {(activeCategory === 'all' || activeCategory === 'teacher') && teacherOverlaps.length > 0 && (
        <div
          className={`rounded-xl border shadow-xl overflow-hidden ${
            isLight
              ? 'bg-white border-rose-200 shadow-rose-100/40'
              : 'bg-[#111318] border-rose-900/60 shadow-black/40'
          }`}
        >
          <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h2 className="text-sm sm:text-base font-black">
                Empalmes de Docentes: Clases Simultáneas ({teacherOverlaps.length})
              </h2>
            </div>
            <span className="text-xs bg-rose-700/80 px-2 py-0.5 rounded font-bold">
              Alta Prioridad
            </span>
          </div>

          <div className={`divide-y p-2 ${isLight ? 'divide-slate-200' : 'divide-rose-950/60'}`}>
            {teacherOverlaps.map((conflict) => {
              const isSolvingThis = solvingConflictId === conflict.id;
              const isSelected = selectedConflict?.id === conflict.id;
              return (
                <div
                  key={conflict.id}
                  onClick={() => setSelectedConflictId(conflict.id)}
                  className={`p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? isLight
                        ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'ring-2 ring-amber-500 bg-amber-950/25 border-amber-500/60 shadow-xs'
                      : isLight
                      ? 'border-transparent hover:bg-rose-50/50'
                      : 'border-transparent hover:bg-rose-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs font-black bg-rose-500 text-white rounded">
                        {conflict.day} • Hora {conflict.slot}
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        Prof(a). {conflict.teacherName}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded shadow-xs">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {conflict.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSolveSingle(conflict);
                      }}
                      disabled={isSolvingThis || autoSolving}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Auto-Fix: Resolver únicamente este conflicto sin alterar el resto del horario"
                    >
                      {isSolvingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                      )}
                      <span>Auto-Fix</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        conflict.day &&
                          conflict.slot &&
                          onEditSlot(conflict.day, conflict.slot, conflict.teacherName);
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <span>Editar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Group Overlaps Section */}
      {(activeCategory === 'all' || activeCategory === 'group') && groupOverlaps.length > 0 && (
        <div
          className={`rounded-xl border shadow-xl overflow-hidden ${
            isLight
              ? 'bg-white border-amber-200 shadow-amber-100/40'
              : 'bg-[#111318] border-amber-900/60 shadow-black/40'
          }`}
        >
          <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-white" />
              <h2 className="text-sm sm:text-base font-black">
                Empalmes de Grupo: Doble Materia Asignada ({groupOverlaps.length})
              </h2>
            </div>
            <span className="text-xs bg-amber-700/80 px-2 py-0.5 rounded font-bold">
              Conflicto de Aula
            </span>
          </div>

          <div className={`divide-y p-2 ${isLight ? 'divide-slate-200' : 'divide-amber-950/60'}`}>
            {groupOverlaps.map((conflict) => {
              const isSolvingThis = solvingConflictId === conflict.id;
              const isSelected = selectedConflict?.id === conflict.id;
              return (
                <div
                  key={conflict.id}
                  onClick={() => setSelectedConflictId(conflict.id)}
                  className={`p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? isLight
                        ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'ring-2 ring-amber-500 bg-amber-950/25 border-amber-500/60 shadow-xs'
                      : isLight
                      ? 'border-transparent hover:bg-amber-50/50'
                      : 'border-transparent hover:bg-amber-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs font-black bg-amber-500 text-slate-950 rounded">
                        {conflict.day} • Hora {conflict.slot}
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        Grupo {conflict.groupId}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded shadow-xs">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {conflict.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSolveSingle(conflict);
                      }}
                      disabled={isSolvingThis || autoSolving}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Auto-Fix: Resolver únicamente este conflicto sin alterar el resto del horario"
                    >
                      {isSolvingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                      )}
                      <span>Auto-Fix</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        conflict.day &&
                          conflict.slot &&
                          onEditSlot(conflict.day, conflict.slot, undefined, conflict.groupId);
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <span>Ajustar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Unassigned Hours Section */}
      {(activeCategory === 'all' || activeCategory === 'unassigned') && unassignedHours.length > 0 && (
        <div
          className={`rounded-xl border shadow-xl overflow-hidden ${
            isLight
              ? 'bg-white border-orange-200 shadow-orange-100/40'
              : 'bg-[#111318] border-orange-900/60 shadow-black/40'
          }`}
        >
          <div className="p-4 bg-orange-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-white" />
              <h2 className="text-sm sm:text-base font-black">
                Horas Sin Asignar / Faltantes ({unassignedHours.length})
              </h2>
            </div>
            <span className="text-xs bg-orange-700/80 px-2 py-0.5 rounded font-bold">
              Horas Faltantes
            </span>
          </div>

          <div className={`divide-y p-2 ${isLight ? 'divide-slate-200' : 'divide-orange-950/60'}`}>
            {unassignedHours.map((conflict) => {
              const isSolvingThis = solvingConflictId === conflict.id;
              const isSelected = selectedConflict?.id === conflict.id;
              const missing = Math.abs(conflict.difference || 1);
              return (
                <div
                  key={conflict.id}
                  onClick={() => setSelectedConflictId(conflict.id)}
                  className={`p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? isLight
                        ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'ring-2 ring-amber-500 bg-amber-950/25 border-amber-500/60 shadow-xs'
                      : isLight
                      ? 'border-transparent hover:bg-orange-50/50'
                      : 'border-transparent hover:bg-orange-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs font-black bg-orange-500 text-white rounded">
                        Grupo {conflict.groupId}
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {conflict.subject}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 font-extrabold rounded border border-orange-300 dark:border-orange-800/60">
                        {conflict.scheduledHours ?? 0} de {conflict.expectedHours ?? '?'} hrs (-{missing}h faltantes)
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded shadow-xs">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {conflict.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSolveSingle(conflict);
                      }}
                      disabled={isSolvingThis || autoSolving}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Auto-Fix: Resolver únicamente este conflicto sin alterar el resto del horario"
                    >
                      {isSolvingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                      )}
                      <span>Auto-Fix</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Over-assigned Hours Section */}
      {(activeCategory === 'all' || activeCategory === 'overassigned') && overassignedHours.length > 0 && (
        <div
          className={`rounded-xl border shadow-xl overflow-hidden ${
            isLight
              ? 'bg-white border-purple-200 shadow-purple-100/40'
              : 'bg-[#111318] border-purple-900/60 shadow-black/40'
          }`}
        >
          <div className="p-4 bg-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MinusCircle className="w-5 h-5 text-white" />
              <h2 className="text-sm sm:text-base font-black">
                Horas Sobre-Asignadas / Excedentes ({overassignedHours.length})
              </h2>
            </div>
            <span className="text-xs bg-purple-700/80 px-2 py-0.5 rounded font-bold">
              Horas Excedentes
            </span>
          </div>

          <div className={`divide-y p-2 ${isLight ? 'divide-slate-200' : 'divide-purple-950/60'}`}>
            {overassignedHours.map((conflict) => {
              const isSolvingThis = solvingConflictId === conflict.id;
              const isSelected = selectedConflict?.id === conflict.id;
              const excess = Math.abs(conflict.difference || 1);
              return (
                <div
                  key={conflict.id}
                  onClick={() => setSelectedConflictId(conflict.id)}
                  className={`p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? isLight
                        ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'ring-2 ring-amber-500 bg-amber-950/25 border-amber-500/60 shadow-xs'
                      : isLight
                      ? 'border-transparent hover:bg-purple-50/50'
                      : 'border-transparent hover:bg-purple-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs font-black bg-purple-600 text-white rounded">
                        Grupo {conflict.groupId}
                      </span>
                      <span
                        className={`font-black text-sm ${
                          isLight ? 'text-slate-900' : 'text-slate-100'
                        }`}
                      >
                        {conflict.subject}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-extrabold rounded border border-purple-300 dark:border-purple-800/60">
                        {conflict.scheduledHours ?? 0} de {conflict.expectedHours ?? '?'} hrs (+{excess}h excedente)
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 rounded shadow-xs">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {conflict.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSolveSingle(conflict);
                      }}
                      disabled={isSolvingThis || autoSolving}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Auto-Fix: Resolver únicamente este conflicto sin alterar el resto del horario"
                    >
                      {isSolvingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                      )}
                      <span>Auto-Fix</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Clear State */}
      {totalConflictsCount === 0 && (
        <div
          className={`rounded-2xl p-8 text-center space-y-3 shadow-xl transition-all ${
            isLight
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-emerald-100/40'
              : 'bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 shadow-black/30'
          }`}
        >
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-lg font-black font-serif tracking-tight">
            ¡Horarios 100% Verificados y Libres de Conflictos!
          </h3>
          <p className="text-xs max-w-md mx-auto opacity-85">
            No existen horas sin asignar, horas sobre-asignadas ni empalmes de docentes o grupos. Todas las sesiones pedagógicas cumplen las normas oficiales de la SEP.
          </p>
        </div>
      )}
    </div>
  );
};
