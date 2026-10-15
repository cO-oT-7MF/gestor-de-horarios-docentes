import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Group,
  TimeSlotConfig,
  AcademicLoadItem,
  BreakSegmentAvailability,
  StaggeredBreakSegmentId,
  DutyAssignment,
  SubstitutionAssignment,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import {
  getTeacherAvailability,
  getTeacherStats,
} from '../utils/scheduler';
import { getTeacherByNameOrAlias } from '../data/teacherCatalog';
import { useTheme } from '../context/ThemeContext';
import { TeacherContactBadge } from './TeacherContactBadge';
import {
  Clock,
  Search,
  UserCheck,
  UserX,
  Calendar,
  UserMinus,
  ShieldAlert,
  Coffee,
  Sparkles,
  Copy,
  Check,
  Shield,
  UserPlus,
  Filter,
  X,
  ExternalLink,
  MapPin,
  Trash2,
  BookOpen,
  LayoutGrid,
  List,
  Zap,
} from 'lucide-react';
import {
  STANDARD_SPECIALTY_FILTERS,
  loadDutyAssignments,
  saveDutyAssignments,
  loadSubstitutionAssignments,
  saveSubstitutionAssignments,
  getTeacherSpecialty,
  matchesSpecialtyFilter,
} from '../utils/dutyManager';
import { AssignDutyModal } from './AssignDutyModal';
import { AssignSubstituteModal } from './AssignSubstituteModal';

interface TeacherAvailabilityViewProps {
  entries: ScheduleEntry[];
  allTeachers: string[];
  academicLoads?: AcademicLoadItem[];
  groups: Group[];
  timeSlots?: TimeSlotConfig[];
  onSelectTeacher: (teacher: string) => void;
}

export const TeacherAvailabilityView: React.FC<TeacherAvailabilityViewProps> = ({
  entries,
  allTeachers,
  academicLoads,
  timeSlots = TIME_SLOTS,
  onSelectTeacher,
}) => {
  const { isLight } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lunes');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId>(4); // Default to slot 4 to showcase staggered breaks
  const [selectedBreakSegment, setSelectedBreakSegment] = useState<0 | 1 | 2 | 3>(1);
  const [searchDocente, setSearchDocente] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('Todas las Especialidades');
  const [copiedRoster, setCopiedRoster] = useState(false);

  // Persistent duty & substitution state
  const [dutyAssignments, setDutyAssignments] = useState<DutyAssignment[]>([]);
  const [substitutionAssignments, setSubstitutionAssignments] = useState<SubstitutionAssignment[]>([]);

  // Modal states
  const [dutyModalOpen, setDutyModalOpen] = useState(false);
  const [selectedTeacherForDuty, setSelectedTeacherForDuty] = useState<{
    name: string;
    rfc?: string;
    specialty: string;
    staggeredSegment?: StaggeredBreakSegmentId;
  } | null>(null);

  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [substituteModalData, setSubstituteModalData] = useState<{
    initialSubstituteTeacher?: string;
    initialAbsentTeacher?: string;
    initialGroup?: string;
    initialSubject?: string;
    staggeredSegment?: StaggeredBreakSegmentId;
  }>({});

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setDutyAssignments(loadDutyAssignments());
    setSubstitutionAssignments(loadSubstitutionAssignments());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentSlotConfig = timeSlots.find((s) => s.id === selectedSlot) || timeSlots[0];
  const availability = useMemo(() => {
    return getTeacherAvailability(
      selectedDay,
      selectedSlot,
      entries,
      allTeachers,
      academicLoads
    );
  }, [selectedDay, selectedSlot, entries, allTeachers, academicLoads]);

  const isPeriod4 = selectedSlot === 4;
  const breakSegments = availability.period4Breakdown || [];
  const currentBreakSegment: BreakSegmentAvailability | undefined =
    selectedBreakSegment > 0
      ? breakSegments.find((s) => s.segmentId === selectedBreakSegment)
      : undefined;

  // Active assignments for current Day and Slot
  const currentSlotDuties = useMemo(() => {
    return dutyAssignments.filter(
      (d) => d.day === selectedDay && d.slot === selectedSlot
    );
  }, [dutyAssignments, selectedDay, selectedSlot]);

  const currentSlotSubs = useMemo(() => {
    return substitutionAssignments.filter(
      (s) => s.day === selectedDay && s.slot === selectedSlot
    );
  }, [substitutionAssignments, selectedDay, selectedSlot]);

  // Handle duty assignment
  const handleConfirmDuty = (newAssignment: Omit<DutyAssignment, 'id' | 'assignedAt'>) => {
    const record: DutyAssignment = {
      ...newAssignment,
      id: `duty-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      assignedAt: new Date().toISOString(),
    };
    const updated = [
      ...dutyAssignments.filter(
        (d) => !(d.teacherName === record.teacherName && d.day === record.day && d.slot === record.slot)
      ),
      record,
    ];
    setDutyAssignments(updated);
    saveDutyAssignments(updated);
    showToast(`Guardia asignada a ${record.teacherName} en ${record.zone}`);
  };

  const handleDeleteDuty = (id: string) => {
    const updated = dutyAssignments.filter((d) => d.id !== id);
    setDutyAssignments(updated);
    saveDutyAssignments(updated);
    showToast('Asignación de guardia eliminada');
  };

  // Handle substitution assignment
  const handleConfirmSubstitution = (newSub: Omit<SubstitutionAssignment, 'id' | 'assignedAt'>) => {
    const record: SubstitutionAssignment = {
      ...newSub,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      assignedAt: new Date().toISOString(),
    };
    const updated = [
      ...substitutionAssignments.filter(
        (s) => !(s.substituteTeacherName === record.substituteTeacherName && s.day === record.day && s.slot === record.slot)
      ),
      record,
    ];
    setSubstitutionAssignments(updated);
    saveSubstitutionAssignments(updated);
    showToast(`Suplencia asignada: ${record.substituteTeacherName} cubrirá al grupo ${record.groupId}`);
  };

  const handleDeleteSub = (id: string) => {
    const updated = substitutionAssignments.filter((s) => s.id !== id);
    setSubstitutionAssignments(updated);
    saveSubstitutionAssignments(updated);
    showToast('Asignación de suplencia eliminada');
  };

  // Open modal for duty
  const openDutyAssignment = (
    teacherName: string,
    staggeredSegment?: StaggeredBreakSegmentId
  ) => {
    const cat = getTeacherByNameOrAlias(teacherName);
    const specialty = getTeacherSpecialty(teacherName, entries, academicLoads);
    setSelectedTeacherForDuty({
      name: teacherName,
      rfc: cat?.payrollId,
      specialty,
      staggeredSegment,
    });
    setDutyModalOpen(true);
  };

  // Open modal for substitution
  const openSubstituteAssignmentForAvailable = (
    teacherName: string,
    staggeredSegment?: StaggeredBreakSegmentId
  ) => {
    setSubstituteModalData({
      initialSubstituteTeacher: teacherName,
      staggeredSegment,
    });
    setSubstituteModalOpen(true);
  };

  const openSubstituteAssignmentForInClass = (
    absentTeacher: string,
    group: string,
    subject: string,
    staggeredSegment?: StaggeredBreakSegmentId
  ) => {
    setSubstituteModalData({
      initialAbsentTeacher: absentTeacher,
      initialGroup: group,
      initialSubject: subject,
      staggeredSegment,
    });
    setSubstituteModalOpen(true);
  };

  // Prepare lists for table
  // 1. Available teachers in current context
  const rawAvailableList = useMemo(() => {
    if (isPeriod4 && selectedBreakSegment > 0 && currentBreakSegment) {
      return currentBreakSegment.dutyEligibleTeachers.map((d) => ({
        teacherName: d.teacherName,
        payrollId: d.payrollId,
        specialty: getTeacherSpecialty(d.teacherName, entries, academicLoads),
        source: d.source,
        assignedGroup: d.assignedGroup,
        assignedSubject: d.assignedSubject,
        statusLabel: d.statusLabel,
        totalWeeklyHours: d.totalWeeklyHours || 0,
        staggeredSegment: (selectedBreakSegment === 1 ? 1 : selectedBreakSegment === 2 ? 2 : 3) as StaggeredBreakSegmentId,
      }));
    } else {
      return availability.available.map((t) => {
        const cat = getTeacherByNameOrAlias(t);
        const stats = getTeacherStats(t, entries);
        return {
          teacherName: t,
          payrollId: cat?.payrollId,
          specialty: getTeacherSpecialty(t, entries, academicLoads),
          source: 'no_class_in_period' as const,
          assignedGroup: undefined,
          assignedSubject: undefined,
          statusLabel: `Libre en módulo • ${stats.totalHours}/35 mód asignados`,
          totalWeeklyHours: stats.totalHours,
          staggeredSegment: undefined,
        };
      });
    }
  }, [isPeriod4, selectedBreakSegment, currentBreakSegment, availability.available, entries, academicLoads]);

  // Filter available teachers by search and specialty
  const filteredAvailableList = useMemo(() => {
    return rawAvailableList.filter((item) => {
      const matchSearch =
        item.teacherName.toLowerCase().includes(searchDocente.toLowerCase()) ||
        (item.payrollId && item.payrollId.toLowerCase().includes(searchDocente.toLowerCase())) ||
        (item.assignedGroup && item.assignedGroup.toLowerCase().includes(searchDocente.toLowerCase())) ||
        (item.assignedSubject && item.assignedSubject.toLowerCase().includes(searchDocente.toLowerCase())) ||
        item.specialty.toLowerCase().includes(searchDocente.toLowerCase());

      const matchSpec = matchesSpecialtyFilter(item.specialty, specialtyFilter);
      return matchSearch && matchSpec;
    });
  }, [rawAvailableList, searchDocente, specialtyFilter]);

  // 2. In-Class teachers in current context
  const rawInClassList = useMemo(() => {
    if (isPeriod4 && selectedBreakSegment > 0 && currentBreakSegment) {
      return currentBreakSegment.teachingTeachers.map((t) => ({
        teacherName: t.teacherName,
        payrollId: t.payrollId,
        groupId: t.groupId,
        subject: t.subject,
        grade: t.grade,
        statusDescription: t.statusDescription,
      }));
    } else {
      return availability.busy.map((b) => {
        const cat = getTeacherByNameOrAlias(b.teacherName);
        return {
          teacherName: b.teacherName,
          payrollId: cat?.payrollId,
          groupId: b.groupId,
          subject: b.subject,
          grade: b.groupId.charAt(0),
          statusDescription: 'Impartiendo clase en salón',
        };
      });
    }
  }, [isPeriod4, selectedBreakSegment, currentBreakSegment, availability.busy]);

  const filteredInClassList = useMemo(() => {
    return rawInClassList.filter((item) => {
      return (
        item.teacherName.toLowerCase().includes(searchDocente.toLowerCase()) ||
        (item.payrollId && item.payrollId.toLowerCase().includes(searchDocente.toLowerCase())) ||
        item.groupId.toLowerCase().includes(searchDocente.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchDocente.toLowerCase())
      );
    });
  }, [rawInClassList, searchDocente]);

  // Inactive teachers
  const filteredInactive = useMemo(() => {
    return availability.inactive.filter((i) =>
      i.teacherName.toLowerCase().includes(searchDocente.toLowerCase())
    );
  }, [availability.inactive, searchDocente]);

  // View mode: 'cards' (virtualized list of instructor cards) vs 'table' (compact tabular view)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Virtualizer scroll container refs
  const availableParentRef = useRef<HTMLDivElement>(null);
  const inClassParentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtualizer instances for 60 FPS scrolling and instantaneous module switching
  const availableVirtualizer = useVirtualizer({
    count: filteredAvailableList.length,
    getScrollElement: () => availableParentRef.current,
    estimateSize: () => 92,
    overscan: 5,
  });

  const inClassVirtualizer = useVirtualizer({
    count: filteredInClassList.length,
    getScrollElement: () => inClassParentRef.current,
    estimateSize: () => 84,
    overscan: 5,
  });

  // Reset scroll to top smoothly when changing modules, days or filters to prevent FPS lag
  useEffect(() => {
    if (availableParentRef.current) {
      availableParentRef.current.scrollTop = 0;
    }
    if (inClassParentRef.current) {
      inClassParentRef.current.scrollTop = 0;
    }
  }, [selectedDay, selectedSlot, selectedBreakSegment, searchDocente, specialtyFilter]);

  // Copy Roster function
  const handleCopyRoster = () => {
    const lines: string[] = [
      `=============================================================`,
      `ESCUELA SECUNDARIA TÉCNICA 129 • TURNO VESPERTINO`,
      `DISTRIBUCIÓN DE GUARDIAS Y DISPONIBILIDAD - ${selectedDay.toUpperCase()}`,
      `MÓDULO: ${currentSlotConfig.name} (${currentSlotConfig.startTime} - ${currentSlotConfig.endTime})`,
      `=============================================================`,
      ``,
    ];

    if (isPeriod4 && breakSegments.length) {
      breakSegments.forEach((seg) => {
        lines.push(`-------------------------------------------------------------`);
        lines.push(`🥪 ${seg.label.toUpperCase()}`);
        lines.push(`   ${seg.description}`);
        lines.push(`   Aptos para guardia: ${seg.dutyEligibleTeachers.length}`);
        lines.push(`-------------------------------------------------------------`);
        seg.dutyEligibleTeachers.forEach((t, idx) => {
          const spec = getTeacherSpecialty(t.teacherName, entries, academicLoads);
          const duty = dutyAssignments.find((d) => d.teacherName === t.teacherName && d.day === selectedDay && d.timeSlotId === 4);
          const dutyText = duty ? ` [GUARDIA ASIGNADA: ${duty.zone}]` : '';
          lines.push(`   ${idx + 1}. ${t.teacherName} (${spec}) - ${t.statusLabel}${dutyText}`);
        });
        lines.push(``);
      });
    } else {
      lines.push(`DOCENTES DISPONIBLES (${filteredAvailableList.length}):`);
      filteredAvailableList.forEach((t, idx) => {
        const duty = dutyAssignments.find((d) => d.teacherName === t.teacherName && d.day === selectedDay && d.slot === selectedSlot);
        const dutyText = duty ? ` [GUARDIA: ${duty.zone}]` : '';
        lines.push(`   ${idx + 1}. ${t.teacherName} (${t.specialty})${dutyText}`);
      });
    }

    if (currentSlotDuties.length > 0) {
      lines.push(``);
      lines.push(`GUARDIAS ESCOLARES REGISTRADAS:`);
      currentSlotDuties.forEach((d, idx) => {
        lines.push(`   ${idx + 1}. ${d.teacherName} -> ${d.zone}${d.notes ? ` (${d.notes})` : ''}`);
      });
    }

    if (currentSlotSubs.length > 0) {
      lines.push(``);
      lines.push(`SUPLENCIAS ASIGNADAS:`);
      currentSlotSubs.forEach((s, idx) => {
        lines.push(`   ${idx + 1}. ${s.substituteTeacherName} cubre a ${s.absentTeacherName} (Grupo ${s.groupId} - ${s.subject}) [${s.reason || 'Suplencia'}]`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRoster(true);
    showToast('Nómina de disponibilidad y guardias copiada al portapapeles');
    setTimeout(() => setCopiedRoster(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/60 text-purple-200 shadow-2xl shadow-purple-950/50 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div
        className={`rounded-xl border p-5 shadow-xl transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/60'
            : 'bg-[#111318] border-slate-800/90 text-slate-100 shadow-black/40'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/50 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 font-black text-xs uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Módulo de Guardias y Disponibilidad Escolar</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight">
              Gestión de Guardias y Suplencias
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Asigne guardias de patio o suplencias inmediatas a docentes libres con un solo clic sin salir de la pantalla. En el 4º módulo (15:00 - 16:00), el receso escalonado muestra qué maestros tienen alumnos en patio.
            </p>
          </div>

          <button
            onClick={handleCopyRoster}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
            title="Copiar nómina de disponibilidad y guardias para WhatsApp o impresión"
          >
            {copiedRoster ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Nómina Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>Copiar Nómina de Guardias</span>
              </>
            )}
          </button>
        </div>

        {/* Day and Module Selector */}
        <div className="mt-4 space-y-3">
          {/* Days */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-2">Día:</span>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-purple-600 text-white font-black shadow-sm'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-[#16181f] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Time Slots */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-bold text-slate-400 mr-2">Módulo:</span>
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              const hasRecess = slot.id === 4;
              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlot(slot.id);
                    if (slot.id === 4 && selectedBreakSegment === 0) {
                      setSelectedBreakSegment(1);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 font-black shadow-sm'
                      : hasRecess
                      ? isLight
                        ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                        : 'bg-purple-950/20 text-purple-300 border-purple-800/60 hover:border-purple-600'
                      : isLight
                      ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      : 'bg-[#12151e] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{slot.name}</span>
                    {hasRecess && (
                      <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">
                        Receso
                      </span>
                    )}
                  </div>
                  <div className={`text-[10px] ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                    {slot.startTime} - {slot.endTime}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recess Grade Staggered Selector (if slot 4) */}
      {isPeriod4 && (
        <div
          className={`rounded-xl border p-4 shadow-lg ${
            isLight
              ? 'bg-amber-50/60 border-amber-200 text-slate-900'
              : 'bg-amber-950/15 border-amber-800/50 text-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                4º Período (15:00 - 16:00) • Subdivisión de Recesos Escalonados
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Cada grado tiene 20 min de patio; el docente a cargo acompaña a sus alumnos.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {breakSegments.map((seg) => {
              const isSelected = selectedBreakSegment === seg.segmentId;
              const assignedCount = seg.dutyEligibleTeachers.filter((t) => t.source === 'assigned_grade_recess').length;
              const unassignedCount = seg.dutyEligibleTeachers.filter((t) => t.source === 'no_class_in_period').length;

              return (
                <button
                  key={seg.segmentId}
                  type="button"
                  onClick={() => setSelectedBreakSegment(seg.segmentId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/40'
                      : isLight
                      ? 'bg-white border-amber-200 text-slate-800 hover:bg-amber-100/50'
                      : 'bg-[#16181f] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">
                      {seg.startTime} - {seg.endTime}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white text-purple-900'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {seg.targetGrade}º Grado
                    </span>
                  </div>
                  <div className="text-[11px] mt-1 opacity-90 truncate">{seg.description}</div>
                  <div className="mt-2 text-[10px] flex items-center justify-between border-t border-current/20 pt-1.5">
                    <span>{seg.dutyEligibleTeachers.length} Aptos para Guardia</span>
                    <span className="font-bold">
                      {assignedCount} en patio + {unassignedCount} libres
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Duty & Substitution Ledger for this slot */}
      {(currentSlotDuties.length > 0 || currentSlotSubs.length > 0) && (
        <div
          className={`rounded-xl border p-4 shadow-md ${
            isLight
              ? 'bg-purple-50/50 border-purple-200 text-slate-800'
              : 'bg-purple-950/15 border-purple-900/40 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Asignaciones Activas en este Módulo ({selectedDay} {currentSlotConfig.startTime} - {currentSlotConfig.endTime})
              </span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {currentSlotDuties.length} guardias • {currentSlotSubs.length} suplencias
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentSlotDuties.map((d) => (
              <div
                key={d.id}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs"
              >
                <Shield className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="font-bold">{d.teacherName}</span>
                <span className="text-purple-300">({d.zone})</span>
                <button
                  onClick={() => handleDeleteDuty(d.id)}
                  title="Eliminar asignación de guardia"
                  className="text-purple-400 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {currentSlotSubs.map((s) => (
              <div
                key={s.id}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs"
              >
                <UserPlus className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="font-bold">{s.substituteTeacherName}</span>
                <span className="text-blue-300">
                  cubriendo a {s.absentTeacherName} ({s.groupId})
                </span>
                <button
                  onClick={() => handleDeleteSub(s.id)}
                  title="Eliminar asignación de suplencia"
                  className="text-blue-400 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Specialty Filter, and View Mode Toggle Bar */}
      <div
        className={`rounded-xl border p-3 shadow-md flex flex-col sm:flex-row items-center gap-3 ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#111318] border-slate-800'
        }`}
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchDocente}
            onChange={(e) => setSearchDocente(e.target.value)}
            placeholder="Buscar docente por nombre, RFC, grupo o materia..."
            className={`w-full pl-9 pr-8 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-purple-400 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                : 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
            }`}
          />
          {searchDocente && (
            <button
              onClick={() => setSearchDocente('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Specialty Filter Dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-purple-400 shrink-0 hidden sm:block" />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className={`w-full sm:w-56 px-3 py-2 text-xs rounded-lg border font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-400 ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-slate-900 border-slate-700 text-slate-100'
            }`}
          >
            {STANDARD_SPECIALTY_FILTERS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Virtualized Cards vs Compact Table */}
        <div
          className={`flex items-center rounded-lg p-0.5 border shrink-0 ${
            isLight
              ? 'bg-slate-100 border-slate-300'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Vista de tarjetas con scroll virtual (60 FPS, sin caídas de rendimiento)"
            className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-purple-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas (60 FPS)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Vista de tabla compacta"
            className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* Main Dual Sections: Available vs In-Class */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Panel 1: Available Teachers (7 Cols) */}
        <div
          className={`xl:col-span-7 rounded-xl border shadow-xl overflow-hidden flex flex-col ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#111318] border-slate-800'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between gap-2 ${
              isLight
                ? 'bg-emerald-50 border-emerald-100 text-emerald-950'
                : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black">
                Docentes Disponibles ({filteredAvailableList.length})
              </h2>
            </div>
            <div className="flex items-center space-x-1.5">
              {viewMode === 'cards' && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span className="hidden sm:inline">Virtualizado</span>
                  <span>60 FPS</span>
                </span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Aptos para Guardia / Suplencia
              </span>
            </div>
          </div>

          {/* Body: Virtualized Cards or Compact Table */}
          {viewMode === 'cards' ? (
            <div
              ref={availableParentRef}
              className="overflow-y-auto h-[540px] p-3 focus:outline-none"
            >
              {filteredAvailableList.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  No hay docentes disponibles con los filtros aplicados en este módulo.
                </div>
              ) : (
                <div
                  style={{
                    height: `${availableVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {availableVirtualizer.getVirtualItems().map((virtualRow) => {
                    const t = filteredAvailableList[virtualRow.index];
                    if (!t) return null;
                    const activeDuty = currentSlotDuties.find(
                      (d) => d.teacherName === t.teacherName
                    );
                    const activeSub = currentSlotSubs.find(
                      (s) => s.substituteTeacher === t.teacherName
                    );
                    const isRecessTeacher = t.source === 'assigned_grade_recess';

                    return (
                      <div
                        key={t.teacherName}
                        ref={availableVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="pb-2.5"
                      >
                        <div
                          className={`p-3 rounded-xl border transition-all ${
                            activeDuty
                              ? isLight
                                ? 'bg-purple-50/90 border-purple-200 shadow-xs'
                                : 'bg-purple-950/30 border-purple-800/60 shadow-xs'
                              : activeSub
                              ? isLight
                                ? 'bg-blue-50/90 border-blue-200 shadow-xs'
                                : 'bg-blue-950/30 border-blue-800/60 shadow-xs'
                              : isLight
                              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                              : 'bg-[#15171e] hover:bg-[#1a1d26] border-slate-800/80 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            {/* Teacher info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span
                                  className={`font-bold text-xs ${
                                    isLight ? 'text-slate-900' : 'text-slate-100'
                                  }`}
                                >
                                  {t.teacherName}
                                </span>
                                {t.payrollId && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {t.payrollId}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isLight
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {t.specialty}
                                </span>
                                <TeacherContactBadge teacherName={t.teacherName} variant="compact" />
                              </div>

                              <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-400 flex-wrap gap-y-1">
                                {isRecessTeacher ? (
                                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                    <Coffee className="w-3.5 h-3.5 shrink-0" />
                                    <span>Alumnos en patio ({t.assignedGroup})</span>
                                  </span>
                                ) : (
                                  <span>Libre en período • {t.totalWeeklyHours} mód/sem</span>
                                )}

                                {activeDuty && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                                    <Shield className="w-2.5 h-2.5" />
                                    <span>Guardia: {activeDuty.zone}</span>
                                  </span>
                                )}
                                {activeSub && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                                    <UserPlus className="w-2.5 h-2.5" />
                                    <span>Suple a {activeSub.groupId}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Direct Actions */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openDutyAssignment(t.teacherName, t.staggeredSegment)
                                }
                                title="Asignar guardia escolar en este módulo sin salir de la pantalla"
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                              >
                                <Shield className="w-3 h-3" />
                                <span className="hidden sm:inline">Guardia</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openSubstituteAssignmentForAvailable(
                                    t.teacherName,
                                    t.staggeredSegment
                                  )
                                }
                                title="Asignar como suplente para cubrir un aula"
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span className="hidden sm:inline">Suplente</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectTeacher(t.teacherName)}
                                title="Ver horario completo del docente"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 h-[540px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <th className="py-2.5 px-3">Docente</th>
                    <th className="py-2.5 px-3">Especialidad</th>
                    <th className="py-2.5 px-3">Situación</th>
                    <th className="py-2.5 px-3 text-right">Acciones Directas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredAvailableList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No hay docentes disponibles con los filtros aplicados en este módulo.
                      </td>
                    </tr>
                  ) : (
                    filteredAvailableList.map((t) => {
                      const activeDuty = currentSlotDuties.find(
                        (d) => d.teacherName === t.teacherName
                      );
                      const activeSub = currentSlotSubs.find(
                        (s) => s.substituteTeacher === t.teacherName
                      );
                      const isRecessTeacher = t.source === 'assigned_grade_recess';

                      return (
                        <tr
                          key={t.teacherName}
                          className={`transition-colors ${
                            activeDuty
                              ? isLight
                                ? 'bg-purple-50/80 hover:bg-purple-100/80'
                                : 'bg-purple-950/20 hover:bg-purple-950/40'
                              : activeSub
                              ? isLight
                                ? 'bg-blue-50/80 hover:bg-blue-100/80'
                                : 'bg-blue-950/20 hover:bg-blue-950/40'
                              : isLight
                              ? 'hover:bg-slate-50'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-100 flex items-center space-x-1.5 flex-wrap">
                              <span>{t.teacherName}</span>
                              {t.payrollId && (
                                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                                  {t.payrollId}
                                </span>
                              )}
                              <TeacherContactBadge teacherName={t.teacherName} variant="compact" />
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5 flex-wrap gap-1">
                              {activeDuty && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                                  <Shield className="w-2.5 h-2.5" />
                                  <span>{activeDuty.zone}</span>
                                </span>
                              )}
                              {activeSub && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                                  <UserPlus className="w-2.5 h-2.5" />
                                  <span>Suple {activeSub.groupId}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isLight
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {t.specialty}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="text-[11px] text-slate-400 leading-tight">
                              {isRecessTeacher ? (
                                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                  <Coffee className="w-3 h-3 shrink-0" />
                                  <span>Alumnos en patio ({t.assignedGroup})</span>
                                </span>
                              ) : (
                                <span>Libre en período • {t.totalWeeklyHours} mód/sem</span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openDutyAssignment(t.teacherName, t.staggeredSegment)
                                }
                                title="Asignar guardia escolar a este docente sin salir de la pantalla"
                                className="px-2 py-1 rounded text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                              >
                                <Shield className="w-3 h-3" />
                                <span>Guardia</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openSubstituteAssignmentForAvailable(
                                    t.teacherName,
                                    t.staggeredSegment
                                  )
                                }
                                title="Asignar como suplente para cubrir un grupo en aula"
                                className="px-2 py-1 rounded text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Suplente</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectTeacher(t.teacherName)}
                                title="Ver horario completo del docente"
                                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 2: In-Class / Busy Teachers (5 Cols) */}
        <div
          className={`xl:col-span-5 rounded-xl border shadow-xl overflow-hidden flex flex-col ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#111318] border-slate-800'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between gap-2 ${
              isLight
                ? 'bg-amber-50 border-amber-100 text-amber-950'
                : 'bg-amber-950/40 border-amber-900/60 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black">
                Docentes en Aula ({filteredInClassList.length})
              </h2>
            </div>
            <div className="flex items-center space-x-1.5">
              {viewMode === 'cards' && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span className="hidden sm:inline">Virtualizado</span>
                  <span>60 FPS</span>
                </span>
              )}
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                En clase activa
              </span>
            </div>
          </div>

          {/* Body: Virtualized Cards or Compact Table */}
          {viewMode === 'cards' ? (
            <div
              ref={inClassParentRef}
              className="overflow-y-auto h-[540px] p-3 focus:outline-none"
            >
              {filteredInClassList.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  No hay docentes impartiendo clase en este módulo.
                </div>
              ) : (
                <div
                  style={{
                    height: `${inClassVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {inClassVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredInClassList[virtualRow.index];
                    if (!item) return null;

                    return (
                      <div
                        key={`${item.teacherName}-${item.groupId}`}
                        ref={inClassVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="pb-2.5"
                      >
                        <div
                          className={`p-3 rounded-xl border transition-all ${
                            isLight
                              ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                              : 'bg-[#15171e] hover:bg-[#1a1d26] border-slate-800/80 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            {/* Docente and Class info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span
                                  className={`font-bold text-xs ${
                                    isLight ? 'text-slate-900' : 'text-slate-100'
                                  }`}
                                >
                                  {item.teacherName}
                                </span>
                                {item.payrollId && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                    {item.payrollId}
                                  </span>
                                )}
                                <TeacherContactBadge teacherName={item.teacherName} variant="compact" />
                              </div>

                              <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {item.groupId}
                                </span>
                                <span className="text-xs text-slate-300 font-medium">
                                  {item.subject}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  • En clase activa
                                </span>
                              </div>
                            </div>

                            {/* Direct Actions */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openSubstituteAssignmentForInClass(
                                    item.teacherName,
                                    item.groupId,
                                    item.subject
                                  )
                                }
                                title="Asignar suplente si este docente se ausenta"
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                              >
                                <UserPlus className="w-3 h-3 text-slate-950" />
                                <span className="hidden sm:inline">Cubrir</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectTeacher(item.teacherName)}
                                title="Ver horario del docente"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 h-[540px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <th className="py-2.5 px-3">Docente</th>
                    <th className="py-2.5 px-3">Materia</th>
                    <th className="py-2.5 px-3">Grupo</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredInClassList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No hay docentes impartiendo clase en este módulo.
                      </td>
                    </tr>
                  ) : (
                    filteredInClassList.map((item) => (
                      <tr
                        key={`${item.teacherName}-${item.groupId}`}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-100 flex items-center space-x-1.5 flex-wrap">
                            <span>{item.teacherName}</span>
                            <TeacherContactBadge teacherName={item.teacherName} variant="compact" />
                          </div>
                          {item.payrollId && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {item.payrollId}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="text-slate-300 font-medium">{item.subject}</span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.groupId}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                openSubstituteAssignmentForInClass(
                                  item.teacherName,
                                  item.groupId,
                                  item.subject
                                )
                              }
                              title="Asignar un suplente libre para cubrir este grupo si el maestro se ausenta"
                              className="px-2 py-1 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1"
                            >
                              <UserPlus className="w-3 h-3 text-slate-950" />
                              <span>Cubrir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onSelectTeacher(item.teacherName)}
                              title="Ver horario del docente"
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inactive / Excluded Teachers from Duty Pool */}
      {filteredInactive.length > 0 && (
        <div
          className={`rounded-xl border shadow-lg overflow-hidden ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[#111318] border-slate-800 text-slate-300'
          }`}
        >
          <div
            className={`p-3 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Docentes Inactivos o Sin Carga ({filteredInactive.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Excluidos de guardias por regla de 0 horas lectivas
            </span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredInactive.map((item) => {
              const catalogInfo = getTeacherByNameOrAlias(item.teacherName);
              return (
                <div
                  key={item.teacherName}
                  className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold">{item.teacherName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {catalogInfo?.payrollId || item.teacherId || 'RFC N/A'}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.reason}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals for Direct In-Screen Assignment */}
      {dutyModalOpen && selectedTeacherForDuty && (
        <AssignDutyModal
          isOpen={dutyModalOpen}
          onClose={() => setDutyModalOpen(false)}
          onAssign={handleConfirmDuty}
          teacherName={selectedTeacherForDuty.name}
          teacherRfc={selectedTeacherForDuty.rfc}
          teacherSpecialty={selectedTeacherForDuty.specialty}
          selectedDay={selectedDay}
          selectedSlot={selectedSlot}
          timeLabel={`${currentSlotConfig.startTime} - ${currentSlotConfig.endTime}`}
          staggeredSegment={selectedTeacherForDuty.staggeredSegment}
          isLight={isLight}
        />
      )}

      {substituteModalOpen && (
        <AssignSubstituteModal
          isOpen={substituteModalOpen}
          onClose={() => setSubstituteModalOpen(false)}
          onAssign={handleConfirmSubstitution}
          initialSubstituteTeacher={substituteModalData.initialSubstituteTeacher}
          initialAbsentTeacher={substituteModalData.initialAbsentTeacher}
          initialGroup={substituteModalData.initialGroup}
          initialSubject={substituteModalData.initialSubject}
          availableTeachers={filteredAvailableList.map((t) => t.teacherName)}
          inClassEntries={rawInClassList.map((i) => ({
            id: `${i.teacherName}-${i.groupId}`,
            teacherName: i.teacherName,
            group: i.groupId,
            subject: i.subject,
            day: selectedDay,
            timeSlot: selectedSlot,
            classroom: '',
          }))}
          selectedDay={selectedDay}
          selectedSlot={selectedSlot}
          timeLabel={`${currentSlotConfig.startTime} - ${currentSlotConfig.endTime}`}
          staggeredSegment={substituteModalData.staggeredSegment}
          isLight={isLight}
        />
      )}
    </div>
  );
};
