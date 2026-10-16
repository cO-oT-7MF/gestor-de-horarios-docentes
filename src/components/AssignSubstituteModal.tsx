import React, { useState } from 'react';
import {
  UserCheck,
  X,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  UserPlus,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  SubstitutionAssignment,
  DayOfWeek,
  TimeSlotId,
  StaggeredBreakSegmentId,
  ScheduleEntry,
} from '../types';
import { SUBSTITUTION_REASONS } from '../utils/dutyManager';

interface AssignSubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignment: Omit<SubstitutionAssignment, 'id' | 'assignedAt'>) => void;
  initialSubstituteTeacher?: string;
  initialAbsentTeacher?: string;
  initialGroup?: string;
  initialSubject?: string;
  availableTeachers: string[];
  inClassEntries: ScheduleEntry[];
  selectedDay: DayOfWeek;
  selectedSlot: TimeSlotId;
  timeLabel: string;
  staggeredSegment?: StaggeredBreakSegmentId;
  isLight: boolean;
}

export const AssignSubstituteModal: React.FC<AssignSubstituteModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  initialSubstituteTeacher = '',
  initialAbsentTeacher = '',
  initialGroup = '',
  initialSubject = '',
  availableTeachers,
  inClassEntries,
  selectedDay,
  selectedSlot,
  timeLabel,
  staggeredSegment,
  isLight,
}) => {
  const [substituteTeacher, setSubstituteTeacher] = useState(
    initialSubstituteTeacher || availableTeachers[0] || ''
  );
  const [absentTeacher, setAbsentTeacher] = useState(
    initialAbsentTeacher || inClassEntries[0]?.teacherName || ''
  );
  const [group, setGroup] = useState(
    initialGroup || inClassEntries[0]?.group || '1ºA'
  );
  const [subject, setSubject] = useState(
    initialSubject || inClassEntries[0]?.subject || 'Clase'
  );
  const [reason, setReason] = useState<string>(SUBSTITUTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [activityForStudents, setActivityForStudents] = useState('');

  // When absent teacher selection changes, auto-fill group & subject
  const handleAbsentTeacherChange = (teacherName: string) => {
    setAbsentTeacher(teacherName);
    const entry = inClassEntries.find((e) => e.teacherName === teacherName);
    if (entry) {
      setGroup(entry.group);
      setSubject(entry.subject);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!substituteTeacher || !absentTeacher || !group) return;

    onAssign({
      substituteTeacherName: substituteTeacher,
      absentTeacherName: absentTeacher,
      groupId: group,
      subject,
      day: selectedDay,
      slot: selectedSlot,
      breakSegmentId: staggeredSegment,
      reason: reason === 'Otro' && customReason.trim() ? customReason.trim() : reason,
      notes: activityForStudents.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[460px] max-h-[85vh] sm:max-h-[80dvh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
            : 'bg-[#12151e] border-slate-800 text-slate-100 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isLight
              ? 'bg-blue-50/70 border-blue-100'
              : 'bg-blue-950/20 border-blue-900/40'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
                <span>Asignar Suplencia Docente</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Cobertura
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Asignación de docente disponible para cubrir grupo en aula
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Day and Slot indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedDay}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-sky-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLabel}</span>
            </div>
            {staggeredSegment && (
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Segmento de receso
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Substitute Teacher (The teacher who is free and will teach/cover) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Docente Suplente (Libre)</span>
              </label>
              <select
                value={substituteTeacher}
                onChange={(e) => setSubstituteTeacher(e.target.value)}
                required
                className={`w-full px-3 py-2 text-xs rounded-lg border font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-400 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                {availableTeachers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Absent Teacher (The one needing coverage) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Docente Ausente a Cubrir</span>
              </label>
              <select
                value={absentTeacher}
                onChange={(e) => handleAbsentTeacherChange(e.target.value)}
                required
                className={`w-full px-3 py-2 text-xs rounded-lg border font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-400 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                {inClassEntries.map((e, idx) => (
                  <option key={`${e.teacherName}-${e.group}-${idx}`} value={e.teacherName}>
                    {e.teacherName} ({e.group} - {e.subject})
                  </option>
                ))}
                {!inClassEntries.some((e) => e.teacherName === absentTeacher) && absentTeacher && (
                  <option value={absentTeacher}>{absentTeacher} (Manual)</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Grupo Asignado</span>
              </label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                required
                placeholder="ej: 1ºA, 2ºB..."
                className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Asignatura / Materia</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="ej: Matemáticas, Español..."
                className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Motivo de la Suplencia / Incidencia
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              {SUBSTITUTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {reason === 'Otro' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Especificar motivo..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-400 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Activity for students */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Trabajo / Actividad a Desarrollar con el Grupo (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={activityForStudents}
              onChange={(e) => setActivityForStudents(e.target.value)}
              placeholder="Ej: Resolver ejercicios de la página 45 a 48 del libro de texto en su libreta..."
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-blue-400 resize-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-950/40 cursor-pointer active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirmar Suplencia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
