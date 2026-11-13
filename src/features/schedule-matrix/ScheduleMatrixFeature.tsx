import React, { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ScheduleEntry, DayOfWeek, TimeSlotId } from '../../types';
import { normalizeName } from '../../utils/scheduler';

interface VirtualizedTeacherMatrixProps {
  entries: ScheduleEntry[];
  teachers: string[];
  onSelectTeacher?: (teacher: string) => void;
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const SLOTS: TimeSlotId[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Sábana virtualizada a 60 FPS con @tanstack/react-virtual para matrices de 40+ docentes.
 */
export const VirtualizedTeacherMatrix: React.FC<VirtualizedTeacherMatrixProps> = ({
  entries,
  teachers,
  onSelectTeacher,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');

  const filteredTeachers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? teachers.filter((t) => t.toLowerCase().includes(q)) : teachers;
  }, [teachers, filter]);

  const entryIndex = useMemo(() => {
    const map = new Map<string, ScheduleEntry>();
    for (const e of entries) {
      map.set(`${normalizeName(e.teacherName)}__${e.day}__${e.slot}`, e);
    }
    return map;
  }, [entries]);

  const rowVirtualizer = useVirtualizer({
    count: filteredTeachers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 8,
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-[var(--brand-surface-elevated,#111318)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white">
            Sábana Virtualizada por Docente (60 FPS • {filteredTeachers.length} docentes)
          </h3>
          <p className="text-xs text-slate-400">
            Renderizado virtualizado con @tanstack/react-virtual sin bloqueos de UI
          </p>
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar docente..."
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
        />
      </div>

      <div
        ref={parentRef}
        className="h-[440px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/60"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const teacher = filteredTeachers[virtualRow.index];
            const tNorm = normalizeName(teacher);
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex items-center gap-2 px-3 border-b border-slate-800/70 hover:bg-slate-900/60"
              >
                <button
                  type="button"
                  onClick={() => onSelectTeacher?.(teacher)}
                  className="w-36 shrink-0 text-left text-xs font-semibold text-white truncate hover:text-[var(--brand-primary,#d97706)]"
                >
                  {teacher}
                </button>
                <div className="flex-1 grid grid-cols-5 gap-1.5 overflow-hidden">
                  {DAYS.map((day) => {
                    const dayClasses = SLOTS.map((s) =>
                      entryIndex.get(`${tNorm}__${day}__${s}`)
                    ).filter(Boolean) as ScheduleEntry[];

                    return (
                      <div
                        key={day}
                        className="flex items-center gap-1 text-[10px] text-slate-300 truncate"
                        title={dayClasses.map((c) => `${c.slot}ª ${c.groupId} (${c.subject})`).join(' | ')}
                      >
                        <span className="text-slate-500 font-semibold">{day.slice(0, 2)}:</span>
                        {dayClasses.length === 0 ? (
                          <span className="text-slate-600">—</span>
                        ) : (
                          <span className="truncate">
                            {dayClasses.map((c) => `${c.slot}ª:${c.groupId}`).join(' ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
