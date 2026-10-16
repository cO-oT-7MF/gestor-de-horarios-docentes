import React, { useState, useMemo } from 'react';
import { AcademicLoadItem, Conflict, ScheduleEntry } from '../types';
import {
  TeacherContractProgress,
  getTeacherContractSummary,
} from '../utils/scheduler';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
  Mail,
} from 'lucide-react';
import { TeacherContactBadge } from './TeacherContactBadge';
import { MassNotificationModal } from './MassNotificationModal';

interface TeacherWorkloadDashboardProps {
  allTeachers: string[];
  academicLoads: AcademicLoadItem[];
  entries: ScheduleEntry[];
  conflicts: Conflict[];
  selectedTeacher: string;
  onSelectTeacher: (teacherName: string) => void;
  onOpenMassNotify?: () => void;
}

export const TeacherWorkloadDashboard: React.FC<TeacherWorkloadDashboardProps> = ({
  allTeachers,
  academicLoads,
  entries,
  conflicts,
  selectedTeacher,
  onSelectTeacher,
  onOpenMassNotify,
}) => {
  const { isLight } = useTheme();
  const [filterStatus, setFilterStatus] = useState<'all' | 'under' | 'complete' | 'over'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);

  // Compute contract progress for all teachers
  const summary: TeacherContractProgress[] = useMemo(() => {
    return getTeacherContractSummary(allTeachers, academicLoads, entries, conflicts);
  }, [allTeachers, academicLoads, entries, conflicts]);

  // Overall KPIs
  const totalExpected = useMemo(
    () => summary.reduce((acc, curr) => acc + curr.expectedHours, 0),
    [summary]
  );
  const totalAssigned = useMemo(
    () => summary.reduce((acc, curr) => acc + curr.assignedHours, 0),
    [summary]
  );
  const overallPercentage = totalExpected > 0 ? Math.round((totalAssigned / totalExpected) * 100) : 0;

  const completeCount = useMemo(
    () => summary.filter((t) => t.status === 'complete').length,
    [summary]
  );
  const underCount = useMemo(
    () => summary.filter((t) => t.status === 'under').length,
    [summary]
  );
  const overCount = useMemo(
    () => summary.filter((t) => t.status === 'over').length,
    [summary]
  );

  const missingHours = useMemo(
    () =>
      summary
        .filter((t) => t.status === 'under')
        .reduce((acc, curr) => acc + Math.abs(curr.difference), 0),
    [summary]
  );

  const extraHours = useMemo(
    () =>
      summary
        .filter((t) => t.status === 'over')
        .reduce((acc, curr) => acc + curr.difference, 0),
    [summary]
  );

  // Filtered teachers list
  const filteredList = useMemo(() => {
    let list = summary;

    if (filterStatus !== 'all') {
      list = list.filter((t) => t.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.teacherName.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q)) ||
          t.groups.some((g) => g.toLowerCase().includes(q))
      );
    }

    return list;
  }, [summary, filterStatus, searchQuery]);

  return (
    <div
      id="teacher-workload-mini-dashboard"
      className={`rounded-xl border transition-all duration-200 shadow-xl ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200/50'
          : 'bg-[#111318] border-slate-800/90 shadow-black/40'
      }`}
    >
      {/* Mini-Dashboard Header */}
      <div
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-[#0c0e14]'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base font-black text-slate-100 font-serif tracking-tight">
                Mini-Dashboard de Cumplimiento de Horas Contrato
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Plantilla Académica
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Progreso de horas asignadas en el horario frente a las horas esperadas de carga académica por docente.
            </p>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => (onOpenMassNotify ? onOpenMassNotify() : setIsNotifyModalOpen(true))}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer active:scale-95"
            title="Enviar aviso por correo con copia oculta a toda la plantilla docente"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Notificar Plantilla</span>
            <span className="sm:hidden">Aviso</span>
          </button>

          <div className={`flex items-center p-0.5 rounded-lg border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#16181f] border-slate-800'}`}>
            <button
              onClick={() => setViewMode('grid')}
              title="Vista Cuadrícula"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista Tabla / Lista"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#16181f] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{isCollapsed ? 'Mostrar Panel' : 'Minimizar'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1: Global Progress */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161922] border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Horas Globales</span>
                </span>
                <span className="font-extrabold text-blue-400">{overallPercentage}%</span>
              </div>
              <div className="text-lg font-black text-slate-100">
                {totalAssigned}{' '}
                <span className="text-xs font-semibold text-slate-400">/ {totalExpected} hrs</span>
              </div>
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, overallPercentage)}%` }}
                />
              </div>
            </div>

            {/* KPI 2: Complete */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Carga Completa</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 rounded">100%</span>
              </div>
              <div className="text-lg font-black text-emerald-300">
                {completeCount}{' '}
                <span className="text-xs font-semibold text-emerald-400/80">docentes</span>
              </div>
              <p className="text-[11px] text-emerald-300 font-medium mt-1">Horas asignadas equivalentes a contrato</p>
            </div>

            {/* KPI 3: Under (Pending Hours) */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Horas Pendientes</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-500/20 rounded">{underCount} doc</span>
              </div>
              <div className="text-lg font-black text-amber-300">
                {missingHours}{' '}
                <span className="text-xs font-semibold text-amber-400/80">hrs faltantes</span>
              </div>
              <p className="text-[11px] text-amber-300 font-medium mt-1">
                {underCount} docente{underCount !== 1 ? 's' : ''} con horas por asignar
              </p>
            </div>

            {/* KPI 4: Over (Exceeded Hours) */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Excedentes</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-500/20 rounded">{overCount} doc</span>
              </div>
              <div className="text-lg font-black text-rose-300">
                +{extraHours}{' '}
                <span className="text-xs font-semibold text-rose-400/80">hrs extras</span>
              </div>
              <p className="text-[11px] text-rose-300 font-medium mt-1">Horas asignadas por encima de carga</p>
            </div>
          </div>

          {/* Filters, Tabs & Search Toolbar */}
          <div
            className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#151821] border-slate-800'
            }`}
          >
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Todos ({summary.length})
              </button>

              <button
                onClick={() => setFilterStatus('under')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'under'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-200'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pendientes ({underCount})</span>
              </button>

              <button
                onClick={() => setFilterStatus('complete')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'complete'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-200'
                    : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Completos ({completeCount})</span>
              </button>

              <button
                onClick={() => setFilterStatus('over')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'over'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-700 hover:bg-slate-200'
                    : 'text-rose-400/90 hover:text-rose-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Excedentes ({overCount})</span>
              </button>
            </div>

            {/* Search Input within mini-dashboard */}
            <div className="relative min-w-[240px] max-w-sm">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nombre, materia o grupo..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-hidden transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    : 'bg-[#0d0f15] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Teacher Progress Bars Display: GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredList.map((t, idx) => {
                const isSelected = t.teacherName === selectedTeacher;
                const cappedPercent = Math.min(100, t.percentage);

                let barColor = 'from-emerald-500 to-teal-400';
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100% Completo</span>
                  </span>
                );

                if (t.status === 'under') {
                  barColor = 'from-amber-500 to-amber-400';
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Faltan {Math.abs(t.difference)}h ({t.percentage}%)</span>
                    </span>
                  );
                } else if (t.status === 'over') {
                  barColor = 'from-rose-500 to-rose-400';
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>+{t.difference}h extra ({t.percentage}%)</span>
                    </span>
                  );
                } else if (t.status === 'unassigned') {
                  barColor = 'from-slate-600 to-slate-500';
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700">
                      Sin horas plantilla
                    </span>
                  );
                }

                return (
                  <div
                    key={`dash-grid-${t.teacherName}-${idx}`}
                    onClick={() => onSelectTeacher(t.teacherName)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : isLight
                        ? 'bg-slate-50/80 border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/30'
                        : 'bg-[#151821] border-slate-800 hover:border-slate-700 hover:bg-[#1a1e2a]'
                    }`}
                  >
                    <div>
                      {/* Top row: Name & Selection Indicator */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-xs font-extrabold truncate ${
                              isSelected
                                ? 'text-amber-400 font-black'
                                : 'text-slate-200 group-hover:text-amber-300'
                            }`}
                            title={t.teacherName}
                          >
                            {t.teacherName}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {t.subjects.join(', ') || 'Sin materia asignada'}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 shrink-0">
                            Activo
                          </span>
                        )}
                      </div>

                      {/* Contact Info: Email & WhatsApp Direct Actions */}
                      <div className="py-2 my-1 border-y border-slate-800/60" onClick={(e) => e.stopPropagation()}>
                        <TeacherContactBadge teacherName={t.teacherName} variant="standard" />
                      </div>

                      {/* Progress Bar & Numerical Metrics */}
                      <div className="space-y-1.5 my-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            {t.assignedHours} <span className="text-slate-400 font-medium">/ {t.expectedHours} hrs</span>
                          </span>
                          <span
                            className={`font-black ${
                              t.status === 'complete'
                                ? 'text-emerald-400'
                                : t.status === 'under'
                                ? 'text-amber-400'
                                : t.status === 'over'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {t.percentage}%
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden relative border border-slate-700/50">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${cappedPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: Status badge & Groups */}
                    <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1 mt-1">
                      <div className="shrink-0">{statusBadge}</div>
                      <span className="text-[10px] text-slate-400 truncate text-right">
                        {t.groups.length > 0 ? `${t.groups.length} grupos` : '0 grupos'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Teacher Progress Bars Display: LIST / TABLE VIEW */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0c0e14] text-slate-400 uppercase tracking-wider text-[10px] font-black sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Docente</th>
                    <th className="p-3">Materia(s)</th>
                    <th className="p-3 text-center">Contacto</th>
                    <th className="p-3 text-center">Grupos</th>
                    <th className="p-3 text-center">Esperadas (Contrato)</th>
                    <th className="p-3 text-center">Asignadas</th>
                    <th className="p-3 min-w-[200px]">Barra de Progreso</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredList.map((t, idx) => {
                    const isSelected = t.teacherName === selectedTeacher;
                    const cappedPercent = Math.min(100, t.percentage);

                    let barColor = 'from-emerald-500 to-teal-400';
                    if (t.status === 'under') barColor = 'from-amber-500 to-amber-400';
                    else if (t.status === 'over') barColor = 'from-rose-500 to-rose-400';
                    else if (t.status === 'unassigned') barColor = 'from-slate-600 to-slate-500';

                    return (
                      <tr
                        key={`dash-list-${t.teacherName}-${idx}`}
                        onClick={() => onSelectTeacher(t.teacherName)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 font-medium'
                            : isLight
                            ? 'hover:bg-amber-50/50'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-200">
                          <div className="flex items-center space-x-1.5">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                            <span className={isSelected ? 'text-amber-400 font-extrabold' : ''}>
                              {t.teacherName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 truncate max-w-[180px]">
                          {t.subjects.join(', ') || '-'}
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <TeacherContactBadge teacherName={t.teacherName} variant="compact" />
                        </td>
                        <td className="p-3 text-center text-slate-300 font-medium">
                          {t.groups.join(', ') || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-200">
                          {t.expectedHours} hrs
                        </td>
                        <td className="p-3 text-center font-extrabold text-amber-400">
                          {t.assignedHours} hrs
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{t.assignedHours} de {t.expectedHours} hrs</span>
                              <span className="font-extrabold text-slate-200">{t.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                              <div
                                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
                                style={{ width: `${cappedPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {t.status === 'complete' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              100% Cubierto
                            </span>
                          )}
                          {t.status === 'under' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Faltan {Math.abs(t.difference)}h
                            </span>
                          )}
                          {t.status === 'over' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              +{t.difference}h extra
                            </span>
                          )}
                          {t.status === 'unassigned' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-400">
                              Sin carga
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTeacher(t.teacherName);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isSelected ? 'Viendo' : 'Ver Horario'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredList.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron docentes con el filtro aplicado.
            </div>
          )}
        </div>
      )}

      {/* Standalone Mass Notification Modal */}
      {!onOpenMassNotify && (
        <MassNotificationModal
          isOpen={isNotifyModalOpen}
          onClose={() => setIsNotifyModalOpen(false)}
          allTeachers={allTeachers}
        />
      )}
    </div>
  );
};

