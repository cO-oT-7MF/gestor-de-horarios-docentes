import React, { useState, useMemo } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Conflict,
  Group,
  GradeLevel,
  AcademicLoadItem,
  TimeSlotConfig,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS, getTimeSlotsForShift } from '../data/initialData';
import {
  getSubjectConfig,
  getGroupStats,
  normalizeName,
} from '../utils/scheduler';
import { useTheme } from '../context/ThemeContext';
import {
  Users,
  Award,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Plus,
  BookOpen,
  Coffee,
  Search,
  X,
  Filter,
  User,
} from 'lucide-react';
import { TeacherContactBadge } from './TeacherContactBadge';

interface GroupScheduleViewProps {
  entries: ScheduleEntry[];
  groups: Group[];
  academicLoads: AcademicLoadItem[];
  selectedGroupId: string;
  setSelectedGroupId: (groupId: string) => void;
  conflicts: Conflict[];
  timeSlots?: TimeSlotConfig[];
  onEditSlot: (day: DayOfWeek, slot: TimeSlotId, teacherName?: string, groupId?: string) => void;
  onPrintGroup: (groupId: string) => void;
  onSolveConflict?: (conflict: Conflict) => void;
  onSolveAllConflicts?: () => void;
}

export const GroupScheduleView: React.FC<GroupScheduleViewProps> = ({
  entries,
  groups,
  academicLoads,
  selectedGroupId,
  setSelectedGroupId,
  conflicts,
  timeSlots: defaultTimeSlots = TIME_SLOTS,
  onEditSlot,
  onPrintGroup,
  onSolveConflict,
  onSolveAllConflicts,
}) => {
  const { isLight } = useTheme();
  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentGroup.grade);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [mobileActiveDay, setMobileActiveDay] = useState<DayOfWeek>('Lunes');
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'day_cards' | 'full_table'>('day_cards');

  const gradeGroups = groups.filter((g) => g.grade === selectedGrade);
  const currentLoad = academicLoads.find((l) => l.groupId === selectedGroupId);
  const groupStats = getGroupStats(selectedGroupId, entries, currentLoad);

  // Search & filter within this group's schedule entries
  const trimmedSearch = groupSearchQuery.trim().toLowerCase();

  const totalGroupEntries = useMemo(() => {
    return entries.filter(
      (e) => e.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()
    );
  }, [entries, selectedGroupId]);

  const matchingGroupEntries = useMemo(() => {
    if (!trimmedSearch) return [];
    return totalGroupEntries.filter((e) => {
      const sub = (e.subject || '').toLowerCase();
      const teacher = (e.teacherName || '').toLowerCase();
      const day = (e.day || '').toLowerCase();
      return sub.includes(trimmedSearch) || teacher.includes(trimmedSearch) || day.includes(trimmedSearch);
    });
  }, [totalGroupEntries, trimmedSearch]);

  // Unique subjects in this group with assigned hours count
  const groupSubjects = useMemo(() => {
    const map = new Map<string, { count: number; teacher: string }>();
    totalGroupEntries.forEach((e) => {
      const prev = map.get(e.subject);
      map.set(e.subject, {
        count: (prev?.count || 0) + 1,
        teacher: e.teacherName || prev?.teacher || '',
      });
    });
    return Array.from(map.entries()).map(([subject, data]) => ({
      subject,
      count: data.count,
      teacher: data.teacher,
    }));
  }, [totalGroupEntries]);

  // Unique teachers for this group
  const groupTeachers = useMemo(() => {
    const set = new Set<string>();
    totalGroupEntries.forEach((e) => {
      if (e.teacherName) set.add(e.teacherName);
    });
    return Array.from(set).sort();
  }, [totalGroupEntries]);

  // Derive grade-specific slots for Turno Vespertino (1:00 PM to 6:00 PM, 40-min periods, 20-min break)
  const activeSlots = useMemo(() => {
    return getTimeSlotsForShift('TURNO VESPERTINO', currentGroup.grade);
  }, [currentGroup.grade]);

  // Filter conflicts for this group (including teacher overlaps affecting this group)
  const groupConflicts = conflicts.filter(
    (c) =>
      (c.groupId && c.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()) ||
      (c.type === 'TEACHER_OVERLAP' &&
        totalGroupEntries.some(
          (ge) =>
            ge.day === c.day &&
            ge.slot === c.slot &&
            ge.teacherName &&
            normalizeName(ge.teacherName) === normalizeName(c.teacherName)
        ))
  );

  const handleGradeChange = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    const firstInGrade = groups.find((g) => g.grade === grade);
    if (firstInGrade) {
      setSelectedGroupId(firstInGrade.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {/* Grade & Group Selector Tabs */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 p-5 shadow-xl shadow-black/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Grade Level Tabs */}
          <div className="flex items-center space-x-1.5 bg-[#0a0c10] p-1.5 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => handleGradeChange(1)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                selectedGrade === 1
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1º Secundaria (9 Grupos)
            </button>
            <button
              onClick={() => handleGradeChange(2)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                selectedGrade === 2
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2º Secundaria (7 Grupos)
            </button>
            <button
              onClick={() => handleGradeChange(3)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                selectedGrade === 3
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3º Secundaria (8 Grupos)
            </button>
          </div>

          {/* Action button */}
          <button
            onClick={() => onPrintGroup(selectedGroupId)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1c202a] border border-slate-700/80 text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-xs self-start lg:self-auto"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Imprimir Horario de Grupo</span>
          </button>
        </div>

        {/* Group Pills for the selected grade */}
        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          {gradeGroups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                grp.id === selectedGroupId
                  ? 'bg-[#1c202a] text-amber-300 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                  : 'bg-[#16181f] text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Grupo {grp.name}
            </button>
          ))}
        </div>

        {/* Group Stats Card */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-[#16181f] rounded-lg p-3.5 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-0.5">Asesor(a) de Grupo</div>
              <div className="text-base font-extrabold text-amber-400">
                {currentGroup.advisor || currentLoad?.advisor || 'Sin asignar'}
              </div>
            </div>
            <Award className="w-6 h-6 text-amber-500/60" />
          </div>

          <div className="bg-[#16181f] rounded-lg p-3.5 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-0.5">Módulos Semanales Asignados</div>
              <div className="text-base font-extrabold text-slate-100">
                {groupStats.totalAssigned}{' '}
                <span className="text-xs font-normal text-slate-500">/ 35 módulos (40 min)</span>
              </div>
            </div>
            <Clock className="w-6 h-6 text-slate-500" />
          </div>

          <div className="bg-[#16181f] rounded-lg p-3.5 border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-0.5">Estado del Horario</div>
              <div className={`text-base font-extrabold ${groupStats.freeSlots === 0 && groupConflicts.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {groupStats.freeSlots === 0 && groupConflicts.length === 0
                  ? '✓ Completo y Validado'
                  : groupStats.freeSlots > 0
                  ? `${groupStats.freeSlots} Módulos pendientes`
                  : 'Con Ajustes Requeridos'}
              </div>
            </div>
            {groupStats.freeSlots === 0 && groupConflicts.length === 0 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            )}
          </div>
        </div>

        {/* Subject Hour Balance Bars */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Distribución de Módulos Lectivos por Materia: Grupo {currentGroup.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(groupStats.subjectCounts).map(([subName, data]) => {
              const cfg = getSubjectConfig(subName);
              const isMatch = data.count === data.required;
              return (
                <div
                  key={subName}
                  className="bg-[#16181f] rounded-lg p-2.5 border border-slate-800 text-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 font-bold text-slate-200">
                    <span className="truncate" title={subName}>{cfg.shortName || subName}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded font-extrabold flex items-center gap-1 ${
                        isMatch
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : data.count > data.required
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      <span>{data.count}/{data.required} mód</span>
                      {!isMatch && onSolveConflict && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchingConflict = groupConflicts.find(
                              (c) =>
                                c.subject &&
                                c.subject.trim().toLowerCase() === subName.trim().toLowerCase()
                            );
                            if (matchingConflict) {
                              onSolveConflict(matchingConflict);
                            } else {
                              onSolveConflict({
                                id: `fix-${selectedGroupId}-${subName}`,
                                type: data.count < data.required ? 'UNASSIGNED_HOURS' : 'OVERASSIGNED_HOURS',
                                groupId: selectedGroupId,
                                subject: subName,
                                teacherName: data.teacher,
                                scheduledHours: data.count,
                                expectedHours: data.required,
                                difference: data.count - data.required,
                                description: `${subName}: ${data.count} de ${data.required}h`,
                              });
                            }
                          }}
                          title="Ajustar y resolver carga horaria"
                          className="p-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[9px] font-black cursor-pointer shadow-xs active:scale-90"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    Prof(a): {data.teacher || 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group Conflict Warnings if any */}
        {groupConflicts.length > 0 && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
                : 'bg-rose-950/50 border-rose-800/80 text-rose-200 shadow-md shadow-rose-950/40'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-rose-500">
                  Empalmes o discrepancias detectadas en este grupo ({groupConflicts.length}):
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                  {groupConflicts.map((c) => (
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
                    } else if (onSolveConflict && groupConflicts.length > 0) {
                      onSolveConflict(groupConflicts[0]);
                    }
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Resolución Fluida Automática (100% Horas Asignadas)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Weekly Timetable Grid */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 shadow-xl shadow-black/40 overflow-hidden">
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              Horario Escolar Semanal: <span className="text-amber-300">Grupo {currentGroup.name}</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Turno Vespertino (13:00 - 18:00) • Recesos 15:00 - 16:00</span>
            <span className="hidden md:inline bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] font-bold">
              {currentGroup.grade === 1 && '☕ Receso 1º: 15:00 - 15:20 (Clase posterior 15:20 - 16:00)'}
              {currentGroup.grade === 2 && '☕ Receso 2º: 15:20 - 15:40 • ✂️ Clase Dividida (20m antes: 15:00-15:20 / 20m después: 15:40-16:00)'}
              {currentGroup.grade === 3 && '☕ Receso 3º: 15:40 - 16:00 (Clase previa 15:00 - 15:40)'}
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
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setGroupSearchQuery('');
                }}
                aria-label="Buscar en el horario del grupo"
                placeholder="Buscar materia, docente o día en este grupo (ej. Historia, Karen A)..."
                className={`w-full pl-9 pr-8 py-2 rounded-lg text-xs sm:text-sm transition-all border outline-hidden ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    : 'bg-[#0a0c10] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                }`}
              />
              {groupSearchQuery && (
                <button
                  onClick={() => setGroupSearchQuery('')}
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
                    matchingGroupEntries.length > 0
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
                    {matchingGroupEntries.length > 0
                      ? `${matchingGroupEntries.length} clase(s) encontrada(s)`
                      : 'Sin coincidencias en este grupo'}
                  </span>
                  <button
                    onClick={() => setGroupSearchQuery('')}
                    className="ml-1 hover:opacity-80 underline text-[11px]"
                  >
                    Limpiar
                  </button>
                </div>
              ) : (
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {totalGroupEntries.length} periodos asignados en total
                </span>
              )}
            </div>
          </div>

          {/* Quick Filter Chips for subjects and teachers */}
          {groupSubjects.length > 0 && (
            <div className={`mt-2.5 pt-2.5 border-t flex flex-wrap items-center gap-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Filtro rápido:
              </span>
              <button
                onClick={() => setGroupSearchQuery('')}
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
              {groupSubjects.map(({ subject, count }) => {
                const isActive = trimmedSearch === subject.toLowerCase();
                return (
                  <button
                    key={subject}
                    onClick={() => setGroupSearchQuery(isActive ? '' : subject)}
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
              {groupTeachers.length > 1 && (
                <div className={`flex items-center gap-1 ml-2 border-l pl-2 ${isLight ? 'border-slate-300' : 'border-slate-700/60'}`}>
                  <span className={`text-[10px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Docentes:</span>
                  {groupTeachers.map((teacher) => {
                    const isActive = trimmedSearch === teacher.toLowerCase();
                    return (
                      <button
                        key={teacher}
                        onClick={() => setGroupSearchQuery(isActive ? '' : teacher)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all border ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                            : isLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            : 'bg-[#0e1015] text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {teacher}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#16181f] border-b border-slate-800 text-slate-300 text-xs uppercase tracking-wider font-bold">
                <th className="p-3 w-32 text-center border-r border-slate-800">Módulo Lectivo</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="p-3 text-center border-r border-slate-800 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {(() => {
                const renderDayCells = (slotId: TimeSlotId, partBadge?: string) => {
                  return DAYS_OF_WEEK.map((day) => {
                    const matchingEntries = entries.filter(
                      (e) =>
                        e.day === day &&
                        e.slot === slotId &&
                        e.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()
                    );

                    const hasGroupOverlap = matchingEntries.length > 1;
                    const hasTeacherOverlap = matchingEntries.some((e) =>
                      e.teacherName &&
                      conflicts.some(
                        (c) =>
                          c.type === 'TEACHER_OVERLAP' &&
                          c.day === day &&
                          c.slot === slotId &&
                          normalizeName(c.teacherName) === normalizeName(e.teacherName)
                      )
                    );
                    const hasConflict = hasGroupOverlap || hasTeacherOverlap;

                    if (matchingEntries.length === 0) {
                      return (
                        <td
                          key={day}
                          onClick={() => onEditSlot(day, slotId, undefined, selectedGroupId)}
                          className={`p-2 border-r border-slate-800/80 last:border-r-0 text-center align-middle hover:bg-amber-500/5 cursor-pointer group transition-all ${
                            trimmedSearch ? 'opacity-30' : ''
                          }`}
                        >
                          <div className="h-14 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 group-hover:text-amber-400 group-hover:border-amber-500/40 group-hover:bg-amber-500/5 transition-all">
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-amber-400">
                              Sin Asignar
                            </span>
                          </div>
                        </td>
                      );
                    }

                    // Check if any entry in this cell matches the search
                    const cellHasMatch = trimmedSearch
                      ? matchingEntries.some(
                          (e) =>
                            (e.subject || '').toLowerCase().includes(trimmedSearch) ||
                            (e.teacherName || '').toLowerCase().includes(trimmedSearch) ||
                            (e.day || '').toLowerCase().includes(trimmedSearch)
                        )
                      : false;

                    const relevantConflict = hasConflict
                      ? conflicts.find(
                          (c) =>
                            c.day === day &&
                            c.slot === slotId &&
                            ((c.groupId && c.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()) ||
                              (c.teacherName &&
                                matchingEntries.some((me) => normalizeName(me.teacherName) === normalizeName(c.teacherName))))
                        ) || {
                          id: `conf-grp-${selectedGroupId}-${day}-${slotId}`,
                          type: hasGroupOverlap ? ('GROUP_OVERLAP' as const) : ('TEACHER_OVERLAP' as const),
                          day,
                          slot: slotId,
                          groupId: selectedGroupId,
                          teacherName: matchingEntries[0]?.teacherName,
                          description: hasGroupOverlap
                            ? `Empalme de Grupo (${matchingEntries.length} asignaciones simultáneas)`
                            : `Docente ${matchingEntries[0]?.teacherName} con empalme simultáneo en otro grupo`,
                          affectedEntries: matchingEntries,
                          severity: 'error' as const,
                        }
                      : null;

                    return (
                      <td
                        key={day}
                        onClick={() => onEditSlot(day, slotId, undefined, selectedGroupId)}
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
                                  {hasGroupOverlap
                                    ? `¡Empalme! (${matchingEntries.length} materias)`
                                    : '¡Docente Empalmado!'}
                                </span>
                              </span>
                              {onSolveConflict && relevantConflict && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSolveConflict(relevantConflict);
                                  }}
                                  title="Resolver conflicto y empalme"
                                  className="px-1.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-[9px] font-black flex items-center gap-0.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Fix</span>
                                </button>
                              )}
                            </div>
                          )}
                          {matchingEntries.map((entry) => {
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
                                (entry.teacherName || '').toLowerCase().includes(trimmedSearch) ||
                                (entry.day || '').toLowerCase().includes(trimmedSearch)
                              : false;

                            return (
                              <div
                                key={entry.id}
                                style={{
                                  backgroundColor: bg,
                                  borderColor: isMatch ? '#f59e0b' : border,
                                  color: textColor,
                                }}
                                className={`p-2 rounded-lg border shadow-xs transition-all flex flex-col justify-between min-h-[56px] relative group ${
                                  trimmedSearch
                                    ? isMatch
                                      ? 'ring-2 ring-amber-400 shadow-md shadow-amber-500/20 scale-[1.02] z-10'
                                      : 'opacity-25 grayscale-[50%] hover:opacity-80 transition-opacity'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-extrabold text-xs tracking-tight truncate">
                                    {entry.subject}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isMatch && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-500 text-slate-950 rounded-xs shadow-xs uppercase">
                                        Coincide
                                      </span>
                                    )}
                                    {hasConflict && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-full animate-pulse">
                                        Empalme
                                      </span>
                                    )}
                                    {partBadge && !hasConflict && !isMatch && (
                                      <span className="text-[9px] font-bold opacity-80 bg-black/30 px-1 py-0.5 rounded">
                                        {partBadge}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[11px] font-medium truncate mt-0.5 opacity-90">
                                  Prof(a): {entry.teacherName}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  });
                };

                return activeSlots.map((slot) => {
                  if (slot.isSplit) {
                    return (
                      <React.Fragment key={slot.id}>
                        {/* Split Class - Part 1 (20 min before recess) */}
                        <tr className="hover:bg-slate-800/30 transition-colors bg-[#0c0e12]/60">
                          <td className="p-2.5 text-center bg-[#0e1015] border-r border-slate-800">
                            <div className="font-bold text-slate-200 text-xs">
                              {slot.splitPart1?.name || `${slot.name} (1ª Parte)`}
                            </div>
                            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                              {slot.splitPart1?.startTime || '15:00'} - {slot.splitPart1?.endTime || '15:20'}
                            </div>
                            <span className="inline-block mt-1 text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              20m antes del receso
                            </span>
                          </td>
                          {renderDayCells(slot.id, 'Parte 1 (20m)')}
                        </tr>

                        {/* Staggered Recess in between */}
                        <tr className="bg-amber-950/30 border-y border-amber-800/60">
                          <td
                            colSpan={6}
                            className="py-2.5 px-4 text-center text-xs font-black text-amber-300 tracking-wider uppercase bg-gradient-to-r from-amber-950/30 via-amber-900/40 to-amber-950/30 shadow-inner"
                          >
                            {slot.recessLabel || `☕ Receso Escolar ${currentGroup.grade}º Grado (15:20 - 15:40 • 20 min)`}
                          </td>
                        </tr>

                        {/* Split Class - Part 2 (20 min after recess) */}
                        <tr className="hover:bg-slate-800/30 transition-colors bg-[#0c0e12]/60">
                          <td className="p-2.5 text-center bg-[#0e1015] border-r border-slate-800">
                            <div className="font-bold text-slate-200 text-xs">
                              {slot.splitPart2?.name || `${slot.name} (2ª Parte)`}
                            </div>
                            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                              {slot.splitPart2?.startTime || '15:40'} - {slot.splitPart2?.endTime || '16:00'}
                            </div>
                            <span className="inline-block mt-1 text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              20m después del receso
                            </span>
                          </td>
                          {renderDayCells(slot.id, 'Parte 2 (20m)')}
                        </tr>
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={slot.id}>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        {/* Time slot */}
                        <td className="p-3 text-center bg-[#0e1015] border-r border-slate-800">
                          <div className="font-bold text-slate-200 text-xs">{slot.name}</div>
                          <div className="text-[11px] text-amber-400/90 font-medium">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </td>

                        {/* 5 Day Columns */}
                        {renderDayCells(slot.id)}
                      </tr>

                      {/* Recess row */}
                      {slot.isRecessAfter && (
                        <tr className="bg-amber-950/25 border-y border-amber-800/50">
                          <td
                            colSpan={6}
                            className="py-2 px-4 text-center text-xs font-black text-amber-300 tracking-wider uppercase bg-gradient-to-r from-amber-950/20 via-amber-900/30 to-amber-950/20"
                          >
                            {slot.recessLabel || `☕ Receso Escolar ${currentGroup.grade}º Grado (20 min)`}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
