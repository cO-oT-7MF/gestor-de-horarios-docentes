import React, { useState, useEffect } from 'react';
import {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  Group,
  TimeSlotConfig,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS, SUBJECTS } from '../data/initialData';
import { normalizeName } from '../utils/scheduler';
import {
  TEACHER_CATALOG,
  standardizeTeacherName,
  getCanonicalTeacherId,
  validateAndCanonicalizeTeacher,
} from '../data/teacherCatalog';
import {
  X,
  Clock,
  AlertTriangle,
  Trash2,
  Check,
  Layers,
  User,
  BookOpen,
  BadgeCheck,
} from 'lucide-react';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  slot: TimeSlotId;
  initialTeacherName?: string;
  initialGroupId?: string;
  entries: ScheduleEntry[];
  groups: Group[];
  allTeachers: string[];
  timeSlots?: TimeSlotConfig[];
  onSaveEntry: (entry: {
    id?: string;
    day: DayOfWeek;
    slot: TimeSlotId;
    groupId: string;
    teacherName: string;
    teacherId?: string;
    subject: string;
  }) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  isOpen,
  onClose,
  day,
  slot,
  initialTeacherName,
  initialGroupId,
  entries,
  groups,
  allTeachers,
  timeSlots = TIME_SLOTS,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(day);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId>(slot);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || groups[0].id);
  const [selectedTeacher, setSelectedTeacher] = useState(initialTeacherName || allTeachers[0] || '');
  const [selectedSubject, setSelectedSubject] = useState('Español');
  const [existingEntryId, setExistingEntryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelectedDay(day);
    setSelectedSlot(slot);

    // Look for existing entry
    let match: ScheduleEntry | undefined;
    if (initialTeacherName) {
      match = entries.find(
        (e) =>
          e.day === day &&
          e.slot === slot &&
          normalizeName(e.teacherName) === normalizeName(initialTeacherName)
      );
    } else if (initialGroupId) {
      match = entries.find(
        (e) =>
          e.day === day &&
          e.slot === slot &&
          e.groupId.trim().toUpperCase() === initialGroupId.trim().toUpperCase()
      );
    }

    if (match) {
      setExistingEntryId(match.id);
      setSelectedGroupId(match.groupId);
      setSelectedTeacher(match.teacherName);
      setSelectedSubject(match.subject);
    } else {
      setExistingEntryId(undefined);
      if (initialGroupId) setSelectedGroupId(initialGroupId);
      if (initialTeacherName) setSelectedTeacher(initialTeacherName);
    }
  }, [day, slot, initialTeacherName, initialGroupId, entries, groups, allTeachers]);

  if (!isOpen) return null;

  // Real-time conflict preview: is selectedTeacher busy at selectedDay + selectedSlot (excluding existingEntryId)?
  const teacherValidation = validateAndCanonicalizeTeacher(selectedTeacher);

  const teacherConflictEntry = entries.find(
    (e) =>
      e.id !== existingEntryId &&
      e.day === selectedDay &&
      e.slot === selectedSlot &&
      normalizeName(e.teacherName) === normalizeName(selectedTeacher)
  );

  // Group conflict preview: is selectedGroupId busy at selectedDay + selectedSlot (excluding existingEntryId)?
  const groupConflictEntry = entries.find(
    (e) =>
      e.id !== existingEntryId &&
      e.day === selectedDay &&
      e.slot === selectedSlot &&
      e.groupId.trim().toUpperCase() === selectedGroupId.trim().toUpperCase()
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeacherName = teacherValidation.standardizedName || standardizeTeacherName(selectedTeacher);
    const cleanTeacherId = teacherValidation.teacherId || getCanonicalTeacherId(cleanTeacherName);

    onSaveEntry({
      id: existingEntryId,
      day: selectedDay,
      slot: selectedSlot,
      groupId: selectedGroupId,
      teacherName: cleanTeacherName,
      teacherId: cleanTeacherId,
      subject: selectedSubject,
    });
    onClose();
  };

  const handleDelete = () => {
    if (existingEntryId) {
      onDeleteEntry(existingEntryId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-[#111318] rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[480px] max-h-[85vh] sm:max-h-[80dvh] shadow-2xl border border-slate-800/90 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-serif">
              {existingEntryId ? 'Editar Sesión de Clase' : 'Asignar Nueva Sesión'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Day and Slot Grid Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Día
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Módulo / Hora
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(Number(e.target.value) as TimeSlotId)}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                {timeSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Grupo Escolar</span>
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  Grupo {g.name} ({g.grade}º Grado) - Asesor: {g.advisor || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Asignatura / Materia</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Docente Asignado</span>
              </span>
              {teacherValidation.isRegistered && teacherValidation.payrollId && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                  RFC: {teacherValidation.payrollId}
                </span>
              )}
            </label>
            <input
              list="all-teachers-modal"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              placeholder="Escriba o seleccione un docente..."
              className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              required
            />
            <datalist id="all-teachers-modal">
              {TEACHER_CATALOG.filter((t) => t.status === 'active').map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} (RFC: {t.payrollId})
                </option>
              ))}
            </datalist>

            {/* Real-time catalog validation feedback */}
            {selectedTeacher.trim().length > 1 && (
              <div className="mt-1.5 text-[11px]">
                {teacherValidation.standardizedName.toUpperCase() !== selectedTeacher.trim().toUpperCase() ? (
                  <div className="flex items-center space-x-1 text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/40">
                    <BadgeCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Variación detectada. Se normalizará a:{' '}
                      <strong className="text-white font-bold">{teacherValidation.standardizedName}</strong>
                    </span>
                  </div>
                ) : teacherValidation.isRegistered ? (
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Docente verificado en catálogo institucional</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[10px]">
                    Docente nuevo/no registrado en catálogo. Se creará ID automático.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Slot 4 / 3:00 PM Break & Split Information */}
          {selectedSlot === 4 && (() => {
            const currentGroupObj = groups.find((g) => g.id === selectedGroupId);
            const grade = currentGroupObj?.grade || 2;
            return (
              <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs space-y-1 text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bloque 15:00 - 16:00 hrs (Recesos Escalonados de 20 min)</span>
                </div>
                {grade === 2 && (
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    ✂️ <strong className="text-white">Clase dividida de 2º Grado:</strong> Se imparten 20 minutos de clase antes del receso (<strong>15:00 - 15:20</strong>), seguidos del receso escolar (<strong>15:20 - 15:40</strong>), y 20 minutos de clase después del receso (<strong>15:40 - 16:00</strong>).
                  </p>
                )}
                {grade === 1 && (
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    ☕ <strong className="text-white">1º Grado:</strong> Receso escolar de <strong>15:00 a 15:20</strong> (20 min) y clase continua de <strong>15:20 a 16:00</strong> (40 min).
                  </p>
                )}
                {grade === 3 && (
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    ☕ <strong className="text-white">3º Grado:</strong> Clase continua de <strong>15:00 a 15:40</strong> (40 min) y receso escolar de <strong>15:40 a 16:00</strong> (20 min).
                  </p>
                )}
              </div>
            );
          })()}

          {/* Conflict Warnings Preview in Real Time */}
          {teacherConflictEntry && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start space-x-2 text-rose-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">¡Alerta de Empalme Docente!</span>
                <p>
                  Prof(a). {selectedTeacher} ya tiene asignada la materia{' '}
                  <span className="font-bold text-rose-100">{teacherConflictEntry.subject}</span> en el{' '}
                  <span className="font-bold text-rose-100">Grupo {teacherConflictEntry.groupId}</span> en este mismo día y hora ({selectedDay} H{selectedSlot}).
                </p>
              </div>
            </div>
          )}

          {groupConflictEntry && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start space-x-2 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">¡Alerta de Empalme de Grupo!</span>
                <p>
                  El Grupo {selectedGroupId} ya tiene asignada la materia{' '}
                  <span className="font-bold text-amber-100">{groupConflictEntry.subject}</span> con{' '}
                  {groupConflictEntry.teacherName} en este módulo.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-2">
            {existingEntryId ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-800/60"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Sesión</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-[#16181f] rounded-lg transition-colors border border-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
