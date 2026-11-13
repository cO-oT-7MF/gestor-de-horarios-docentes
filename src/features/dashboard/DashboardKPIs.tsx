import React from 'react';
import { Users, BookOpenCheck, Scale, Clock3, Building2, Cpu } from 'lucide-react';
import type { ScheduleEntry, AcademicLoadItem, Group } from '../../types';
import type { PlantelPreset } from '../../core/models/institution.types';
import { analyzeScheduleConflicts } from '../../core/scheduler/conflictDetector';
import { WEEKLY_PERIODS_PER_GROUP } from '../../data/presets/sep-secundaria-2027';

interface DashboardKPIsProps {
  institution: PlantelPreset;
  availableInstitutions: PlantelPreset[];
  onSwitchInstitution: (cct: string) => void;
  entries: ScheduleEntry[];
  academicLoads: AcademicLoadItem[];
  groups: Group[];
  isGenerating?: boolean;
  generationProgress?: number;
  onRunWorkerGenerator?: () => void;
  isAdmin: boolean;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  institution,
  availableInstitutions,
  onSwitchInstitution,
  entries,
  academicLoads,
  groups,
  isGenerating = false,
  generationProgress = 0,
  onRunWorkerGenerator,
  isAdmin,
}) => {
  const activeGroupsCount = groups.length;
  const curriculumDemand = activeGroupsCount * WEEKLY_PERIODS_PER_GROUP;
  const loadDemand = academicLoads.reduce(
    (s, a) =>
      s +
      (Object.values(a.subjects || {}) as { hours: number }[]).reduce(
        (subSum, sub) => subSum + (sub?.hours || 0),
        0
      ),
    0
  );
  const coveredHours = entries.length;
  const balance = coveredHours - (loadDemand || curriculumDemand);

  const report = React.useMemo(
    () => analyzeScheduleConflicts(entries, academicLoads),
    [entries, academicLoads]
  );

  return (
    <section
      className="rounded-2xl border border-slate-800/80 bg-[var(--brand-surface-elevated,#111318)] p-4 mb-4"
      style={{ fontSize: 'clamp(0.82rem, 0.95vw, 0.95rem)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--brand-primary,#d97706)]/15 text-[var(--brand-primary,#d97706)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm sm:text-base">
              {institution.name} ({institution.cct})
            </h2>
            <p className="text-xs text-slate-400">
              Ciclo {institution.schoolYear} • {institution.shift} •{' '}
              {institution.institutionType === 'SEP_PUBLICA' ? 'SEP Pública' : 'Colegio Particular'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select
              aria-label="Selector de Plantel CCT"
              value={institution.cct}
              onChange={(e) => onSwitchInstitution(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[var(--brand-primary,#d97706)]"
            >
              {availableInstitutions.map((inst) => (
                <option key={inst.cct} value={inst.cct}>
                  {inst.cct} — {inst.name}
                </option>
              ))}
            </select>
          )}

          {isAdmin && onRunWorkerGenerator && (
            <button
              type="button"
              onClick={onRunWorkerGenerator}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              <Cpu className="w-3.5 h-3.5" />
              {isGenerating
                ? `Generando (${generationProgress}%)...`
                : 'Auto-Generar (Web Worker)'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Grupos Activos</span>
            <Users className="w-4 h-4 text-[var(--brand-primary,#d97706)]" />
          </div>
          <p className="text-xl font-bold text-white">{activeGroupsCount}</p>
          <p className="text-[11px] text-slate-500">
            Demanda SEP: {curriculumDemand} hrs/sem
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Demanda vs. Cubiertas</span>
            <BookOpenCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white">
            {coveredHours} <span className="text-xs font-normal text-slate-400">/ {loadDemand || curriculumDemand}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Cobertura: {Math.round((coveredHours / Math.max(1, loadDemand || curriculumDemand)) * 100)}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Déficit / Superávit</span>
            <Scale className="w-4 h-4 text-sky-400" />
          </div>
          <p
            className={`text-xl font-bold ${
              balance === 0 ? 'text-emerald-400' : balance < 0 ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {balance > 0 ? `+${balance}` : balance} hrs
          </p>
          <p className="text-[11px] text-slate-500">
            {report.conflicts.length} conflictos • {report.classroomOverlaps.length} empalmes aula
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Horas Puente</span>
            <Clock3 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white">{report.totalBridgeHours}</p>
          <p className="text-[11px] text-slate-500">
            Huecos intermedios en plantilla
          </p>
        </div>
      </div>
    </section>
  );
};
