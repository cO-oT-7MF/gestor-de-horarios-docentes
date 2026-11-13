import React, { useState, useMemo } from 'react';
import { ShieldAlert, Zap, CheckCircle2, Trash2, UserPlus } from 'lucide-react';
import { AnchorTooltip } from '../../components/AnchorTooltip';
import type {
  DayOfWeek,
  TimeSlotId,
  ScheduleEntry,
  AcademicLoadItem,
  DutyAssignment,
  DutyZone,
  StaggeredBreakSegmentId,
} from '../../types';
import {
  findOptimalGuardCandidates,
  buildOneClickDutyAssignment,
} from '../../core/scheduler/guardOptimizer';

interface GuardsSubstitutionsPanelProps {
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  duties: DutyAssignment[];
  onAssignDuty: (duty: DutyAssignment) => void;
  onRemoveDuty: (id: string) => void;
  isAdmin: boolean;
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS: TimeSlotId[] = [1, 2, 3, 4, 5, 6, 7];
const QUICK_ZONES: DutyZone[] = [
  'Patio Central',
  'Canchas Deportivas',
  'Portón y Acceso Principal',
  'Pasillos y Sanitarios',
  'Cafetería / Comedor',
];

export const GuardsSubstitutionsPanel: React.FC<GuardsSubstitutionsPanelProps> = ({
  entries,
  academicLoads,
  duties,
  onAssignDuty,
  onRemoveDuty,
  isAdmin,
}) => {
  const [day, setDay] = useState<DayOfWeek>('Lunes');
  const [slot, setSlot] = useState<TimeSlotId>(4);
  const [segmentId, setSegmentId] = useState<StaggeredBreakSegmentId>(1);
  const [selectedZone, setSelectedZone] = useState<DutyZone>('Patio Central');

  const candidates = useMemo(
    () =>
      findOptimalGuardCandidates({
        day,
        slot,
        entries,
        academicLoads,
        existingDuties: duties,
        segmentId: slot === 4 ? segmentId : undefined,
      }),
    [day, slot, entries, academicLoads, duties, segmentId]
  );

  const handleOneClickAssign = (candidateIdx = 0) => {
    const candidate = candidates[candidateIdx];
    if (!candidate) return;
    const duty = buildOneClickDutyAssignment({
      zone: selectedZone,
      day,
      slot,
      candidate,
      segmentId: slot === 4 ? segmentId : undefined,
    });
    onAssignDuty(duty);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-[var(--brand-surface-elevated,#111318)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--brand-primary,#d97706)]" />
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Guardias y Suplencias en 1 Clic
              </h3>
              <p className="text-xs text-slate-400">
                Cálculo automático de docentes libres por módulo y recesos escalonados
              </p>
            </div>
          </div>

          {isAdmin && candidates.length > 0 && (
            <button
              type="button"
              onClick={() => handleOneClickAssign(0)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] hover:opacity-90"
            >
              <Zap className="w-4 h-4" />
              Asignar Óptimo ({candidates[0].teacherName})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value as DayOfWeek)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value) as TimeSlotId)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}ª Hora {s === 4 ? '(Receso Escalonado)' : ''}
              </option>
            ))}
          </select>

          {slot === 4 && (
            <select
              value={segmentId}
              onChange={(e) => setSegmentId(Number(e.target.value) as StaggeredBreakSegmentId)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value={1}>1er Receso (1º Grado)</option>
              <option value={2}>2do Receso (2º Grado)</option>
              <option value={3}>3er Receso (3º Grado)</option>
            </select>
          )}

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value as DutyZone)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
          >
            {QUICK_ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {candidates.slice(0, 12).map((c, idx) => (
            <div
              key={c.teacherName}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/70"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{c.teacherName}</p>
                <p className="text-[11px] text-slate-400 truncate">{c.reason}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOneClickAssign(idx)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  1-Clic
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[var(--brand-surface-elevated,#111318)] p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Guardias Asignadas ({duties.length})
        </h4>
        {duties.length === 0 ? (
          <p className="text-xs text-slate-500">No hay guardias registradas aún.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {duties.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
              >
                <div>
                  <span className="font-semibold text-white">{d.teacherName}</span>
                  <span className="text-slate-400">
                    {' '}
                    • {d.zone} ({d.day} {d.slot}ª)
                  </span>
                </div>
                {isAdmin && (
                  <AnchorTooltip label="Eliminar guardia">
                    <button
                      type="button"
                      onClick={() => onRemoveDuty(d.id)}
                      aria-label="Eliminar guardia"
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AnchorTooltip>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
