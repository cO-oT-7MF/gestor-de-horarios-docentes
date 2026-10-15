import React, { useState, useMemo } from 'react';
import { AcademicLoadItem, Group, SchoolInfo } from '../types';
import {
  FileSpreadsheet,
  Edit2,
  Check,
  X,
  School,
  Printer,
  Users,
  Search,
  Upload,
  Sparkles,
  Download,
  RotateCcw,
  ChevronDown,
  CalendarPlus,
  UserPlus,
  BarChart3,
  ShieldAlert,
  Mail,
} from 'lucide-react';
import { DepartmentStatisticsView } from './DepartmentStatisticsView';
import { TeacherContactBadge } from './TeacherContactBadge';
import { MassNotificationModal } from './MassNotificationModal';
import {
  normalizeSubjectName,
  generateAcademicLoadMatrixTemplate,
  generateAcademicLoadListTemplate,
  sanitizeAcademicLoads,
} from '../utils/scheduler';

interface AcademicLoadViewProps {
  academicLoads: AcademicLoadItem[];
  setAcademicLoads: React.Dispatch<React.SetStateAction<AcademicLoadItem[]>>;
  allTeachers: string[];
  groups: Group[];
  schoolInfo: SchoolInfo;
  onPrintLoad: () => void;
  onOpenUploadModal?: () => void;
  onOpenGenerateModal?: () => void;
  onRestoreInitialValues?: () => void;
  onSelectUploadOption?: (option: 'new_cycle' | 'add_teacher' | 'reset_initial') => void;
}

export const AcademicLoadView: React.FC<AcademicLoadViewProps> = ({
  academicLoads,
  setAcademicLoads,
  allTeachers,
  schoolInfo,
  onPrintLoad,
  onOpenUploadModal,
  onOpenGenerateModal,
  onRestoreInitialValues,
  onSelectUploadOption,
}) => {
  const [subView, setSubView] = useState<'matrix' | 'statistics'>('matrix');
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    groupId: string;
    subjectKey?: string;
    isAdvisor?: boolean;
  } | null>(null);

  const [selectedTeacherEdit, setSelectedTeacherEdit] = useState('');
  const [selectedHoursEdit, setSelectedHoursEdit] = useState<number>(4);
  const [filterGrade, setFilterGrade] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [isMassNotifyOpen, setIsMassNotifyOpen] = useState(false);

  const handleDownloadTemplate = (type: 'matrix' | 'list') => {
    const content =
      type === 'matrix'
        ? generateAcademicLoadMatrixTemplate()
        : generateAcademicLoadListTemplate();
    const name =
      type === 'matrix'
        ? 'Plantilla_Carga_Docente_Matriz_SEP.csv'
        : 'Plantilla_Carga_Docente_Lista.csv';

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sanitizedLoads = useMemo(() => sanitizeAcademicLoads(academicLoads), [academicLoads]);

  const filteredLoads = sanitizedLoads.filter((item) => {
    if (filterGrade !== 'ALL' && item.grade !== filterGrade) return false;
    if (searchTeacher) {
      const matchAdvisor = item.advisor.toLowerCase().includes(searchTeacher.toLowerCase());
      const matchSubject = Object.values(item.subjects).some((s: { teacherName: string; hours: number }) =>
        s.teacherName.toLowerCase().includes(searchTeacher.toLowerCase())
      );
      if (!matchAdvisor && !matchSubject) return false;
    }
    return true;
  });

  const handleStartEdit = (
    groupId: string,
    subjectKey?: string,
    isAdvisor?: boolean,
    currentVal?: string,
    currentHours?: number
  ) => {
    setEditingCell({ groupId, subjectKey, isAdvisor });
    setSelectedTeacherEdit(currentVal || '');
    setSelectedHoursEdit(currentHours || 4);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    setAcademicLoads((prev) =>
      sanitizeAcademicLoads(
        prev.map((item) => {
          if (item.groupId !== editingCell.groupId) return item;

          if (editingCell.isAdvisor) {
            return { ...item, advisor: selectedTeacherEdit };
          }

          if (editingCell.subjectKey && item.subjects[editingCell.subjectKey]) {
            return {
              ...item,
              subjects: {
                ...item.subjects,
                [editingCell.subjectKey]: {
                  ...item.subjects[editingCell.subjectKey],
                  teacherName: selectedTeacherEdit,
                  hours: Math.max(1, selectedHoursEdit),
                },
              },
            };
          }

          return item;
        })
      )
    );

    setEditingCell(null);
  };

  // Calculate total hours per teacher from Academic Load
  const teacherWorkloads: Record<string, { totalHours: number; groups: string[] }> = {};
  for (const item of academicLoads) {
    for (const [, val] of Object.entries(item.subjects) as [string, { teacherName: string; hours: number }][]) {
      if (!val.teacherName) continue;
      const t = val.teacherName;
      if (!teacherWorkloads[t]) {
        teacherWorkloads[t] = { totalHours: 0, groups: [] };
      }
      teacherWorkloads[t].totalHours += val.hours;
      if (!teacherWorkloads[t].groups.includes(item.groupId)) {
        teacherWorkloads[t].groups.push(item.groupId);
      }
    }
  }

  const sortedTeacherLoads = Object.entries(teacherWorkloads).sort(
    (a, b) => b[1].totalHours - a[1].totalHours
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-5">
      {/* Sub-view Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] p-2.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="academic-load-tab-matrix"
            onClick={() => setSubView('matrix')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              subView === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Matriz Oficial de Carga</span>
          </button>

          <button
            type="button"
            id="academic-load-tab-statistics"
            onClick={() => setSubView('statistics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              subView === 'statistics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas por Departamento</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black ${
                subView === 'statistics'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              Recharts
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 px-2">
          {subView === 'matrix' ? (
            <span>Edición y asignación de plantilla oficial por grupo</span>
          ) : (
            <span>Distribución de horas asignadas por área de asignatura y campo formativo</span>
          )}
        </div>
      </div>

      {subView === 'statistics' ? (
        <DepartmentStatisticsView
          academicLoads={sanitizedLoads}
          schoolInfo={schoolInfo}
          onBackToMatrix={() => setSubView('matrix')}
          onPrint={onPrintLoad}
        />
      ) : (
        <>
          {/* Official Header Card */}
          <div className="bg-[#111318] rounded-xl border border-slate-800/90 p-6 shadow-xl shadow-black/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                  <School className="w-4 h-4" />
                  <span>Plantilla Oficial de Asignación Docente</span>
                </div>
                <h1 className="text-xl font-black text-slate-100 font-serif tracking-tight">{schoolInfo.name}</h1>
                <p className="text-xs text-slate-400">
                  {schoolInfo.schoolYear} • {schoolInfo.zone} • {schoolInfo.workCenterKey} • {schoolInfo.regionalUnit}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                {/* Cluster 1: Acciones Operativas de Carga y Malla */}
                <div className="flex items-center space-x-1.5 p-0.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
                  {onOpenGenerateModal && (
                    <button
                      onClick={onOpenGenerateModal}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-emerald-950/25 active:scale-95 cursor-pointer"
                      title="Generar asignaciones de horarios para todos los grupos y docentes automáticamente"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Generar Horarios</span>
                    </button>
                  )}

                  {/* Upload Workload Button with Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      id="academic-load-upload-dropdown-btn"
                      onClick={() => setIsUploadDropdownOpen((prev) => !prev)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md shadow-amber-950/20 active:scale-95 cursor-pointer"
                      title="Opciones de Carga: Iniciar nuevo ciclo, agregar nuevo docente o opciones avanzadas"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Cargar Carga</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isUploadDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isUploadDropdownOpen && (
                      <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 rounded-xl bg-[#12151e] border border-slate-800 text-slate-100 shadow-2xl p-2 z-30 animate-in fade-in">
                        <div className="px-3 py-1.5 border-b border-slate-800 mb-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                            Opciones de Carga Docente
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Compatible con Google Doc e integración directa
                          </p>
                        </div>

                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUploadDropdownOpen(false);
                              if (onSelectUploadOption) onSelectUploadOption('new_cycle');
                              else if (onOpenUploadModal) onOpenUploadModal();
                            }}
                            className="w-full flex items-start space-x-2.5 p-2 rounded-lg text-left hover:bg-slate-800/80 transition-colors cursor-pointer"
                          >
                            <div className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                              <CalendarPlus className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black block text-emerald-400">
                                Iniciar nuevo ciclo
                              </span>
                              <span className="text-[11px] text-slate-400 leading-tight block">
                                Cargar Google Doc y generar la malla completa optimizada para secundaria
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUploadDropdownOpen(false);
                              if (onSelectUploadOption) onSelectUploadOption('add_teacher');
                              else if (onOpenUploadModal) onOpenUploadModal();
                            }}
                            className="w-full flex items-start space-x-2.5 p-2 rounded-lg text-left hover:bg-slate-800/80 transition-colors cursor-pointer"
                          >
                            <div className="p-1.5 rounded-md bg-blue-500/15 text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">
                              <UserPlus className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-black block text-blue-400">
                                Agregar nuevo docente
                              </span>
                              <span className="text-[11px] text-slate-400 leading-tight block">
                                Cargar asignación e insertar clases en huecos libres sin alterar otros horarios
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Safety / Maintenance Subsection in Dropdown */}
                        <div className="pt-1.5 mt-1.5 border-t border-slate-800">
                          <div className="px-2 py-0.5 mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Mantenimiento</span>
                            <span className="text-amber-400 text-[9px] px-1 rounded bg-amber-500/10 border border-amber-500/20">Protegido</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUploadDropdownOpen(false);
                              if (onRestoreInitialValues) onRestoreInitialValues();
                              else if (onSelectUploadOption) onSelectUploadOption('reset_initial');
                            }}
                            className="w-full flex items-start space-x-2.5 p-2 rounded-lg text-left hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-500 shrink-0 mt-0.5 border border-amber-500/30">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-amber-400">
                                Restablecer valores de fábrica...
                              </span>
                              <span className="text-[10px] text-slate-400 leading-tight block">
                                Requiere confirmación de seguridad explícita
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CSV Template */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center space-x-1 px-3 py-2 bg-[#16181f] border border-slate-700/80 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Plantilla CSV</span>
                    </button>
                    <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-[#111318] border border-slate-700 rounded-lg shadow-xl z-20 w-48 p-1">
                      <button
                        onClick={() => handleDownloadTemplate('matrix')}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded font-medium cursor-pointer"
                      >
                        Matriz SEP (Grupos x Materias)
                      </button>
                      <button
                        onClick={() => handleDownloadTemplate('list')}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded font-medium cursor-pointer"
                      >
                        Lista (Docente, Materia, Grupo)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />

                {/* Cluster 2: Análisis, Reportes y Notificaciones */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsMassNotifyOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Enviar correo masivo con copia oculta a toda la plantilla docente"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Notificar Plantilla</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubView('statistics')}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-[#16181f] border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Visualizar gráficas y distribución de horas por departamento con Recharts"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Estadísticas</span>
                  </button>

                  <button
                    onClick={onPrintLoad}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-[#1c202a] border border-slate-700/80 text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-800 hover:border-slate-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Imprimir</span>
                  </button>
                </div>

                <div className="h-6 w-px bg-slate-800/80 hidden md:block" />

                {/* Cluster 3: Mantenimiento Seguro (Isolated at right) */}
                {onRestoreInitialValues && (
                  <button
                    type="button"
                    id="academic-load-restore-initial-btn"
                    onClick={onRestoreInitialValues}
                    title="Mantenimiento Seguro: Restablecer todos los horarios y carga académica oficial a valores iniciales"
                    className="flex items-center space-x-1.5 px-2.5 py-2 bg-[#0f1117] border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-600/50 hover:bg-amber-950/20 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="hidden xl:inline text-[11px]">Restablecer...</span>
                  </button>
                )}
              </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-[#0a0c10] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterGrade('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterGrade === 'ALL' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos los Grados (24 Grupos)
            </button>
            <button
              onClick={() => setFilterGrade(1)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterGrade === 1 ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1º Grado (1ºA - 1ºI)
            </button>
            <button
              onClick={() => setFilterGrade(2)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterGrade === 2 ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2º Grado (2ºA - 2ºG)
            </button>
            <button
              onClick={() => setFilterGrade(3)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterGrade === 3 ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3º Grado (3ºA - 3ºH)
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por maestro o asesor..."
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-[#0a0a0a] border border-slate-700 text-slate-200 placeholder-slate-500 text-xs rounded-lg w-60 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Carga Académica Table */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 shadow-xl shadow-black/40 overflow-hidden">
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Matriz Oficial de Carga Académica por Grupo</h2>
          </div>
          <span className="text-xs text-slate-400">
            Haga clic en cualquier celda para reasignar el docente o asesor
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#16181f] border-b border-slate-800 text-slate-300 uppercase font-extrabold tracking-tight">
                <th className="p-3 border-r border-slate-800 bg-[#16181f] sticky left-0 z-10 w-20 text-center text-slate-200">
                  GRUPOS
                </th>
                <th className="p-2 border-r border-slate-800 text-center">ESPAÑOL (5)</th>
                <th className="p-2 border-r border-slate-800 text-center">MATEM. (5)</th>
                <th className="p-2 border-r border-slate-800 text-center">CIENCIAS (4/6/6)</th>
                <th className="p-2 border-r border-slate-800 text-center">INGLÉS (3)</th>
                <th className="p-2 border-r border-slate-800 text-center">GEOG. (4)</th>
                <th className="p-2 border-r border-slate-800 text-center">F.C. y E. (2)</th>
                <th className="p-2 border-r border-slate-800 text-center">HISTORIA (2/4/4)</th>
                <th className="p-2 border-r border-slate-800 text-center">ARTES (3)</th>
                <th className="p-2 border-r border-slate-800 text-center">TEC. (3)</th>
                <th className="p-2 border-r border-slate-800 text-center">ED. FIS. (2)</th>
                <th className="p-2 border-r border-slate-800 text-center">TUTORÍA (1)</th>
                <th className="p-2 border-r border-slate-800 text-center">INT. C. (1)</th>
                <th className="p-2 text-center bg-amber-950/40 text-amber-300 font-black">
                  ASESOR DE GRUPO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLoads.map((load, rowIdx) => {
                const getTeacherFor = (keyPattern: string) => {
                  for (const [subKey, val] of Object.entries(load.subjects) as [string, { teacherName: string; hours: number }][]) {
                    if (normalizeSubjectName(subKey).includes(keyPattern)) {
                      return { subKey, teacher: val.teacherName, hours: val.hours };
                    }
                  }
                  return { subKey: '', teacher: '-', hours: 0 };
                };

                const subjectColumns = [
                  { label: 'ESPAÑOL', pattern: 'ESPAÑOL' },
                  { label: 'MATEMÁTICAS', pattern: 'MATEM' },
                  { label: 'CIENCIAS', pattern: 'CIENC' },
                  { label: 'INGLÉS', pattern: 'INGL' },
                  { label: 'GEOGRAFÍA', pattern: 'GEOG' },
                  { label: 'F.C. y E.', pattern: 'FORMACIÓN' },
                  { label: 'HISTORIA', pattern: 'HIST' },
                  { label: 'ARTES', pattern: 'ART' },
                  { label: 'TECNOLOGÍA', pattern: 'TEC' },
                  { label: 'ED. FÍSICA', pattern: 'FÍSICA' },
                  { label: 'TUTORÍA', pattern: 'TUTOR' },
                  { label: 'INT. C.', pattern: 'INT' },
                ];

                return (
                  <tr key={`${load.groupId}-${rowIdx}`} className="hover:bg-slate-800/30 transition-colors">
                    {/* Group Name Column */}
                    <td className="p-2.5 font-black text-center bg-[#111318] border-r border-slate-800 text-amber-400 sticky left-0 z-10 shadow-sm">
                      {load.groupName}
                    </td>

                    {/* Subject Assignment Cells */}
                    {subjectColumns.map((col, cIdx) => {
                      const info = getTeacherFor(col.pattern);
                      const isEditingThis =
                        editingCell &&
                        editingCell.groupId === load.groupId &&
                        editingCell.subjectKey === info.subKey;

                      return (
                        <td
                          key={`${col.label}-${cIdx}`}
                          onClick={() => {
                            if (!isEditingThis && info.subKey) {
                              handleStartEdit(load.groupId, info.subKey, false, info.teacher, info.hours);
                            }
                          }}
                          className="p-1.5 border-r border-slate-800/80 text-center font-medium cursor-pointer hover:bg-amber-500/10 transition-colors"
                        >
                          {isEditingThis ? (
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                list="teachers-list"
                                value={selectedTeacherEdit}
                                onChange={(e) => setSelectedTeacherEdit(e.target.value)}
                                className="w-20 p-1 text-xs border border-amber-500 rounded bg-[#0a0a0a] text-slate-100 font-bold"
                                autoFocus
                                placeholder="Docente"
                              />
                              <input
                                type="number"
                                min={1}
                                max={8}
                                value={selectedHoursEdit}
                                onChange={(e) => setSelectedHoursEdit(Number(e.target.value))}
                                className="w-10 p-1 text-xs border border-amber-500 rounded bg-[#0a0a0a] text-amber-300 font-bold text-center"
                                title="Horas semanales asignadas a este docente"
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-white bg-emerald-600 rounded hover:bg-emerald-500"
                                title="Guardar"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="p-1 text-white bg-slate-700 rounded hover:bg-slate-600"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="px-1 py-0.5 rounded text-slate-300 font-semibold hover:text-amber-300 flex items-center justify-center space-x-1">
                              <span className="truncate max-w-[85px]">{info.teacher || '-'}</span>
                              {info.teacher && info.teacher !== '-' && (
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1 rounded border border-amber-500/20">
                                  {info.hours}h
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Group Advisor Column */}
                    {(() => {
                      const isEditingAdvisor =
                        editingCell &&
                        editingCell.groupId === load.groupId &&
                        editingCell.isAdvisor;

                      return (
                        <td
                          onClick={() => {
                            if (!isEditingAdvisor) {
                              handleStartEdit(load.groupId, undefined, true, load.advisor);
                            }
                          }}
                          className="p-1.5 text-center font-bold bg-amber-950/20 text-amber-300 cursor-pointer hover:bg-amber-950/40 transition-colors"
                        >
                          {isEditingAdvisor ? (
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                list="teachers-list"
                                value={selectedTeacherEdit}
                                onChange={(e) => setSelectedTeacherEdit(e.target.value)}
                                className="w-24 p-1 text-xs border border-amber-500 rounded bg-[#0a0a0a] text-slate-100 font-bold"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-white bg-emerald-600 rounded hover:bg-emerald-500"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="p-1 text-white bg-slate-700 rounded hover:bg-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="px-1 py-0.5 rounded font-extrabold text-amber-300">
                              {load.advisor || 'Sin asignar'}
                            </div>
                          )}
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Datalist for fast teacher auto-completion */}
        <datalist id="teachers-list">
          {allTeachers.map((t, idx) => (
            <option key={`${t}-${idx}`} value={t} />
          ))}
        </datalist>
      </div>

      {/* Teacher Workload Summary Table */}
      <div className="bg-[#111318] rounded-xl border border-slate-800/90 p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
              Resumen de Horas Asignadas por Docente
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Docentes Registrados: {sortedTeacherLoads.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedTeacherLoads.map(([tName, data], idx) => {
            const isHeavy = data.totalHours > 35;
            return (
              <div
                key={`${tName}-${idx}`}
                className="bg-[#16181f] rounded-lg p-3 border border-slate-800 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-extrabold text-slate-200 truncate" title={tName}>
                    {tName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                      isHeavy
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'bg-[#1c202a] text-amber-300 border border-slate-700'
                    }`}
                  >
                    {data.totalHours} hrs
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mb-1.5">
                  Grupos: {data.groups.join(', ')}
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <TeacherContactBadge teacherName={tName} variant="standard" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}

      {/* Mass Notification Modal */}
      <MassNotificationModal
        isOpen={isMassNotifyOpen}
        onClose={() => setIsMassNotifyOpen(false)}
        allTeachers={allTeachers}
      />
    </div>
  );
};
