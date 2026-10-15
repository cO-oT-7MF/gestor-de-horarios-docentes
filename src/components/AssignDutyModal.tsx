import React, { useState } from 'react';
import {
  Shield,
  X,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  DutyAssignment,
  DutyZone,
  DayOfWeek,
  TimeSlotId,
  StaggeredBreakSegmentId,
} from '../types';
import { DUTY_ZONES } from '../utils/dutyManager';

interface AssignDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignment: Omit<DutyAssignment, 'id' | 'assignedAt'>) => void;
  teacherName: string;
  teacherRfc?: string;
  teacherSpecialty: string;
  selectedDay: DayOfWeek;
  selectedSlot: TimeSlotId;
  timeLabel: string;
  staggeredSegment?: StaggeredBreakSegmentId;
  isLight: boolean;
}

export const AssignDutyModal: React.FC<AssignDutyModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  teacherName,
  teacherRfc,
  teacherSpecialty,
  selectedDay,
  selectedSlot,
  timeLabel,
  staggeredSegment,
  isLight,
}) => {
  const [selectedZone, setSelectedZone] = useState<DutyZone>('Patio Central');
  const [customZone, setCustomZone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalZone = selectedZone === 'Otra Zona' && customZone.trim() ? (customZone.trim() as DutyZone) : selectedZone;
    onAssign({
      teacherName,
      payrollId: teacherRfc,
      day: selectedDay,
      slot: selectedSlot,
      breakSegmentId: staggeredSegment,
      zone: finalZone,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
            : 'bg-[#12151e] border-slate-800 text-slate-100 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight
              ? 'bg-purple-50/70 border-purple-100'
              : 'bg-purple-950/20 border-purple-900/40'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
                <span>Asignar Guardia Escolar</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Sec. 129
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervisión y vigilancia en áreas escolares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4.5">
          {/* Teacher & Context Summary Box */}
          <div
            className={`p-3.5 rounded-xl border ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Docente Comisionado
                </span>
                <h4 className="text-sm font-black text-slate-100 mt-0.5">{teacherName}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {teacherSpecialty}
                  </span>
                  {teacherRfc && (
                    <span className="text-[11px] font-mono text-slate-400">RFC: {teacherRfc}</span>
                  )}
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="flex items-center space-x-1 text-slate-300 font-semibold justify-end">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedDay}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px] justify-end">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{timeLabel}</span>
                </div>
                {staggeredSegment && (
                  <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {staggeredSegment === 1
                      ? '1º Bloque: 15:00 - 15:20 (1º Grado)'
                      : staggeredSegment === 2
                      ? '2º Bloque: 15:20 - 15:40 (2º Grado)'
                      : '3º Bloque: 15:40 - 16:00 (3º Grado)'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Duty Zone Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>Zona de Guardia Asignada</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DUTY_ZONES.map(({ zone, icon, description }) => {
                const isSelected = selectedZone === zone;
                return (
                  <button
                    type="button"
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-400 text-purple-100 ring-1 ring-purple-400 shadow-sm'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-200'
                        : 'bg-slate-900/30 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{zone}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
                        {description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedZone === 'Otra Zona' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="Especificar zona (ej: Pasillo de Laboratorios, Entrada Secundaria)..."
                  value={customZone}
                  onChange={(e) => setCustomZone(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-purple-400 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Instrucciones / Observaciones (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Registrar alumnos que salgan al sanitario sin pase oficial, vigilar tránsito en escaleras..."
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-purple-400 resize-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* Footer Actions */}
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
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950/40 cursor-pointer active:scale-95"
            >
              <Shield className="w-4 h-4" />
              <span>Confirmar Guardia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
