import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { AcademicLoadItem, SchoolInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3,
  BookOpen,
  PieChart as PieChartIcon,
  TrendingUp,
  Layers,
  GraduationCap,
  Clock,
  Printer,
  Table as TableIcon,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { normalizeSubjectName } from '../utils/scheduler';

interface DepartmentStatisticsViewProps {
  academicLoads: AcademicLoadItem[];
  schoolInfo: SchoolInfo;
  onBackToMatrix?: () => void;
  onPrint?: () => void;
}

interface DepartmentData {
  id: string;
  name: string;
  shortName: string;
  campoFormativo: string;
  color: string;
  grade1Hours: number;
  grade2Hours: number;
  grade3Hours: number;
  totalHours: number;
  percentage: number;
  groupsCount: number;
  teachers: string[];
}

interface CampoFormativoData {
  name: string;
  color: string;
  totalHours: number;
  percentage: number;
  departments: string[];
  teachersCount: number;
}

export const DepartmentStatisticsView: React.FC<DepartmentStatisticsViewProps> = ({
  academicLoads,
  schoolInfo,
  onBackToMatrix,
  onPrint,
}) => {
  const { isLight } = useTheme();

  // Filters and view modes
  const [viewGrouping, setViewGrouping] = useState<'departments' | 'campos'>('departments');
  const [chartType, setChartType] = useState<'stacked' | 'total'>('stacked');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');
  const [sortBy, setSortBy] = useState<'hours_desc' | 'hours_asc' | 'name'>('hours_desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Department definitions and classification helper
  const departmentsConfig = useMemo(
    () => [
      {
        id: 'espanol',
        name: 'Español / Lengua Materna',
        shortName: 'Español',
        campoFormativo: 'Lenguajes',
        color: '#3b82f6',
        patterns: ['ESPAÑOL', 'ESPANOL', 'LENGUA'],
      },
      {
        id: 'matematicas',
        name: 'Matemáticas',
        shortName: 'Matem.',
        campoFormativo: 'Saberes y Pensamiento Científico',
        color: '#ef4444',
        patterns: ['MATEM'],
      },
      {
        id: 'ciencias',
        name: 'Ciencias (Biol / Fís / Quím)',
        shortName: 'Ciencias',
        campoFormativo: 'Saberes y Pensamiento Científico',
        color: '#10b981',
        patterns: ['CIENC', 'BIOL', 'FÍS', 'FISIC', 'QUÍM', 'QUIMIC'],
      },
      {
        id: 'ingles',
        name: 'Lengua Extranjera (Inglés)',
        shortName: 'Inglés',
        campoFormativo: 'Lenguajes',
        color: '#8b5cf6',
        patterns: ['INGL'],
      },
      {
        id: 'historia',
        name: 'Historia',
        shortName: 'Historia',
        campoFormativo: 'Ética, Naturaleza y Sociedades',
        color: '#f59e0b',
        patterns: ['HIST'],
      },
      {
        id: 'geografia',
        name: 'Geografía',
        shortName: 'Geografía',
        campoFormativo: 'Ética, Naturaleza y Sociedades',
        color: '#d97706',
        patterns: ['GEOG'],
      },
      {
        id: 'fce',
        name: 'Formación Cívica y Ética',
        shortName: 'F.C. y E.',
        campoFormativo: 'Ética, Naturaleza y Sociedades',
        color: '#06b6d4',
        patterns: ['FORMACIÓN', 'FORMACION', 'F.C', 'ETICA', 'ÉTICA', 'CIVIC', 'CÍVIC'],
      },
      {
        id: 'artes',
        name: 'Artes',
        shortName: 'Artes',
        campoFormativo: 'Lenguajes',
        color: '#ec4899',
        patterns: ['ART'],
      },
      {
        id: 'tecnologia',
        name: 'Tecnología',
        shortName: 'Tecnología',
        campoFormativo: 'De lo Humano y lo Comunitario',
        color: '#6366f1',
        patterns: ['TEC'],
      },
      {
        id: 'educacion_fisica',
        name: 'Educación Física',
        shortName: 'Ed. Física',
        campoFormativo: 'De lo Humano y lo Comunitario',
        color: '#84cc16',
        patterns: ['FÍSICA', 'FISICA', 'ED. FIS', 'EDUC'],
      },
      {
        id: 'tutoria',
        name: 'Tutoría y Socioemocional',
        shortName: 'Tutoría',
        campoFormativo: 'De lo Humano y lo Comunitario',
        color: '#14b8a6',
        patterns: ['TUTOR'],
      },
      {
        id: 'int_c',
        name: 'Integración Curricular',
        shortName: 'Int. Curric.',
        campoFormativo: 'De lo Humano y lo Comunitario',
        color: '#a855f7',
        patterns: ['INT', 'CURRIC', 'AUTON', 'IC'],
      },
    ],
    []
  );

  // Compute stats across all academic loads
  const { departmentsList, camposList, totalSchoolHours, totalTeachersCount } = useMemo(() => {
    const deptMap: Record<
      string,
      {
        grade1Hours: number;
        grade2Hours: number;
        grade3Hours: number;
        groups: Set<string>;
        teachers: Set<string>;
      }
    > = {};

    departmentsConfig.forEach((d) => {
      deptMap[d.id] = {
        grade1Hours: 0,
        grade2Hours: 0,
        grade3Hours: 0,
        groups: new Set(),
        teachers: new Set(),
      };
    });

    const otherDept = {
      grade1Hours: 0,
      grade2Hours: 0,
      grade3Hours: 0,
      groups: new Set<string>(),
      teachers: new Set<string>(),
    };

    const allTeachersSet = new Set<string>();
    let overallHours = 0;

    // Iterate through all loads
    academicLoads.forEach((load) => {
      const grade = load.grade;
      const grpId = load.groupId;

      (Object.entries(load.subjects) as [string, { teacherName: string; hours: number }][]).forEach(([subName, info]) => {
        const hours = info.hours || 0;
        const teacher = info.teacherName?.trim();
        if (teacher) {
          allTeachersSet.add(teacher);
        }

        const norm = normalizeSubjectName(subName);
        let matchedDept = departmentsConfig.find((d) =>
          d.patterns.some((p) => norm.includes(p))
        );

        if (!matchedDept) {
          // Special fallback for Biología, Física, Química under Ciencias
          if (norm.includes('BIOL') || norm.includes('QUIM') || norm.includes('FISIC')) {
            matchedDept = departmentsConfig.find((d) => d.id === 'ciencias');
          }
        }

        if (matchedDept) {
          overallHours += hours;
          const entry = deptMap[matchedDept.id];
          if (grade === 1) entry.grade1Hours += hours;
          else if (grade === 2) entry.grade2Hours += hours;
          else if (grade === 3) entry.grade3Hours += hours;

          entry.groups.add(grpId);
          if (teacher) entry.teachers.add(teacher);
        } else if (hours > 0) {
          overallHours += hours;
          if (grade === 1) otherDept.grade1Hours += hours;
          else if (grade === 2) otherDept.grade2Hours += hours;
          else if (grade === 3) otherDept.grade3Hours += hours;

          otherDept.groups.add(grpId);
          if (teacher) otherDept.teachers.add(teacher);
        }
      });
    });

    // Build department data items
    const depts: DepartmentData[] = departmentsConfig.map((cfg) => {
      const stats = deptMap[cfg.id];
      const total = stats.grade1Hours + stats.grade2Hours + stats.grade3Hours;
      const pct = overallHours > 0 ? (total / overallHours) * 100 : 0;

      return {
        id: cfg.id,
        name: cfg.name,
        shortName: cfg.shortName,
        campoFormativo: cfg.campoFormativo,
        color: cfg.color,
        grade1Hours: stats.grade1Hours,
        grade2Hours: stats.grade2Hours,
        grade3Hours: stats.grade3Hours,
        totalHours: total,
        percentage: Number(pct.toFixed(1)),
        groupsCount: stats.groups.size,
        teachers: Array.from(stats.teachers).sort(),
      };
    });

    if (otherDept.grade1Hours + otherDept.grade2Hours + otherDept.grade3Hours > 0) {
      const otherTotal =
        otherDept.grade1Hours + otherDept.grade2Hours + otherDept.grade3Hours;
      depts.push({
        id: 'otras',
        name: 'Otras Asignaturas Complementarias',
        shortName: 'Otras',
        campoFormativo: 'Complementario',
        color: '#94a3b8',
        grade1Hours: otherDept.grade1Hours,
        grade2Hours: otherDept.grade2Hours,
        grade3Hours: otherDept.grade3Hours,
        totalHours: otherTotal,
        percentage: Number(((otherTotal / overallHours) * 100).toFixed(1)),
        groupsCount: otherDept.groups.size,
        teachers: Array.from(otherDept.teachers).sort(),
      });
    }

    // Build Campos Formativos data
    const camposMap: Record<
      string,
      {
        totalHours: number;
        color: string;
        departments: Set<string>;
        teachers: Set<string>;
      }
    > = {
      Lenguajes: {
        totalHours: 0,
        color: '#3b82f6',
        departments: new Set(),
        teachers: new Set(),
      },
      'Saberes y Pensamiento Científico': {
        totalHours: 0,
        color: '#10b981',
        departments: new Set(),
        teachers: new Set(),
      },
      'Ética, Naturaleza y Sociedades': {
        totalHours: 0,
        color: '#f59e0b',
        departments: new Set(),
        teachers: new Set(),
      },
      'De lo Humano y lo Comunitario': {
        totalHours: 0,
        color: '#6366f1',
        departments: new Set(),
        teachers: new Set(),
      },
    };

    depts.forEach((d) => {
      const campo = camposMap[d.campoFormativo];
      if (campo) {
        campo.totalHours += d.totalHours;
        campo.departments.add(d.shortName);
        d.teachers.forEach((t) => campo.teachers.add(t));
      }
    });

    const campos: CampoFormativoData[] = Object.entries(camposMap).map(([cName, val]) => ({
      name: cName,
      color: val.color,
      totalHours: val.totalHours,
      percentage: overallHours > 0 ? Number(((val.totalHours / overallHours) * 100).toFixed(1)) : 0,
      departments: Array.from(val.departments),
      teachersCount: val.teachers.size,
    }));

    return {
      departmentsList: depts,
      camposList: campos,
      totalSchoolHours: overallHours,
      totalTeachersCount: allTeachersSet.size,
    };
  }, [academicLoads, departmentsConfig]);

  // Filter and Sort Departments
  const filteredDepartments = useMemo(() => {
    let result = [...departmentsList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.campoFormativo.toLowerCase().includes(q) ||
          d.teachers.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'hours_desc') {
      result.sort((a, b) => {
        const valA =
          gradeFilter === 'ALL'
            ? a.totalHours
            : gradeFilter === 1
            ? a.grade1Hours
            : gradeFilter === 2
            ? a.grade2Hours
            : a.grade3Hours;
        const valB =
          gradeFilter === 'ALL'
            ? b.totalHours
            : gradeFilter === 1
            ? b.grade1Hours
            : gradeFilter === 2
            ? b.grade2Hours
            : b.grade3Hours;
        return valB - valA;
      });
    } else if (sortBy === 'hours_asc') {
      result.sort((a, b) => {
        const valA =
          gradeFilter === 'ALL'
            ? a.totalHours
            : gradeFilter === 1
            ? a.grade1Hours
            : gradeFilter === 2
            ? a.grade2Hours
            : a.grade3Hours;
        const valB =
          gradeFilter === 'ALL'
            ? b.totalHours
            : gradeFilter === 1
            ? b.grade1Hours
            : gradeFilter === 2
            ? b.grade2Hours
            : b.grade3Hours;
        return valA - valB;
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [departmentsList, searchQuery, sortBy, gradeFilter]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (viewGrouping === 'campos') {
      return camposList.map((c) => ({
        name: c.name,
        horasTotales: c.totalHours,
        porcentaje: c.percentage,
        color: c.color,
        docentes: c.teachersCount,
      }));
    }

    return filteredDepartments.map((d) => ({
      name: d.shortName,
      fullName: d.name,
      campoFormativo: d.campoFormativo,
      horas1: d.grade1Hours,
      horas2: d.grade2Hours,
      horas3: d.grade3Hours,
      horasTotales:
        gradeFilter === 'ALL'
          ? d.totalHours
          : gradeFilter === 1
          ? d.grade1Hours
          : gradeFilter === 2
          ? d.grade2Hours
          : d.grade3Hours,
      porcentaje: d.percentage,
      color: d.color,
      docentesCount: d.teachers.length,
      gruposCount: d.groupsCount,
    }));
  }, [viewGrouping, camposList, filteredDepartments, gradeFilter]);

  // Top department
  const topDepartment = useMemo(() => {
    if (departmentsList.length === 0) return null;
    return [...departmentsList].sort((a, b) => b.totalHours - a.totalHours)[0];
  }, [departmentsList]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs transition-all ${
            isLight
              ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-300'
              : 'bg-[#0f1117]/95 border-slate-700 text-slate-100 shadow-black/80'
          }`}
        >
          <div className="flex items-center space-x-2 mb-1.5 pb-1.5 border-b border-slate-700/40">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-extrabold text-sm">{data.fullName || data.name}</span>
          </div>

          <div className="space-y-1 text-slate-300">
            {data.campoFormativo && (
              <p className="text-[11px] text-slate-400">
                Campo Formativo: <span className="font-bold text-slate-200">{data.campoFormativo}</span>
              </p>
            )}

            <div className="flex items-center justify-between gap-4 font-bold text-amber-400">
              <span>Total Horas Asignadas:</span>
              <span className="text-sm font-black">{data.horasTotales} hrs</span>
            </div>

            {chartType === 'stacked' && viewGrouping === 'departments' && (
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800 text-[10px]">
                <span className="text-sky-400">1º: {data.horas1}h</span>
                <span className="text-indigo-400">2º: {data.horas2}h</span>
                <span className="text-violet-400">3º: {data.horas3}h</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-1 text-slate-400 text-[11px]">
              <span>Carga Curricular Escolar:</span>
              <span className="font-bold text-slate-200">{data.porcentaje}%</span>
            </div>

            {data.docentesCount !== undefined && (
              <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px]">
                <span>Docentes Titulares:</span>
                <span className="font-bold text-slate-200">{data.docentesCount}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header & Metric Highlights */}
      <div
        className={`p-6 rounded-2xl border shadow-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/60 text-slate-900'
            : 'bg-[#111318] border-slate-800/90 shadow-black/40 text-slate-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Analítica Curricular y Distribución Académica</span>
            </div>
            <h1 className="text-xl font-black font-serif tracking-tight flex items-center gap-2">
              Estadísticas por Departamento
              <span className="text-[11px] font-sans font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-normal">
                Recharts Visualizer
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {schoolInfo.name} • Distribución de {totalSchoolHours} horas lectivas semanales
              en 24 grupos escolares
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToMatrix && (
              <button
                type="button"
                onClick={onBackToMatrix}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Matriz de Carga</span>
              </button>
            )}

            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center space-x-1.5 px-3 py-2 bg-[#1c202a] border border-slate-700/80 text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-800 hover:border-slate-600 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Imprimir Reporte</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLight
                ? 'bg-blue-50/50 border-blue-200/80'
                : 'bg-blue-950/20 border-blue-900/40'
            }`}
          >
            <div className="flex items-center justify-between text-blue-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                Total Horas Escolares
              </span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-blue-400">{totalSchoolHours}</span>
              <span className="text-xs text-slate-400 font-medium">hrs / semana</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cobertura de 35 periodos semanales x 24 grupos
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              isLight
                ? 'bg-emerald-50/50 border-emerald-200/80'
                : 'bg-emerald-950/20 border-emerald-900/40'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                Mayor Carga Horaria
              </span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400">
                {topDepartment?.shortName || '-'}
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                {topDepartment?.totalHours || 0} hrs
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Representa el {topDepartment?.percentage || 0}% del currículo total
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              isLight
                ? 'bg-amber-50/50 border-amber-200/80'
                : 'bg-amber-950/20 border-amber-900/40'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                Áreas y Academias
              </span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-amber-400">
                {departmentsList.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">departamentos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Agrupados en 4 Campos Formativos SEP
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              isLight
                ? 'bg-purple-50/50 border-purple-200/80'
                : 'bg-purple-950/20 border-purple-900/40'
            }`}
          >
            <div className="flex items-center justify-between text-purple-400 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                Docentes Asignados
              </span>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-purple-400">{totalTeachersCount}</span>
              <span className="text-xs text-slate-400 font-medium">profesores</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Promedio de {(totalSchoolHours / (totalTeachersCount || 1)).toFixed(1)} hrs/docente
            </p>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Grouping, Filters, and Sorting */}
      <div
        className={`p-4 rounded-xl border shadow-md flex flex-wrap items-center justify-between gap-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-[#111318] border-slate-800/90 text-slate-200'
        }`}
      >
        {/* Left: View Mode Grouping */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Agrupar por:
          </span>
          <div
            className={`p-0.5 rounded-lg border flex items-center ${
              isLight ? 'bg-white border-slate-300' : 'bg-[#0a0c10] border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setViewGrouping('departments')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all cursor-pointer ${
                viewGrouping === 'departments'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Áreas de Asignatura (12)
            </button>
            <button
              type="button"
              onClick={() => setViewGrouping('campos')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all cursor-pointer ${
                viewGrouping === 'campos'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Campos Formativos SEP (4)
            </button>
          </div>
        </div>

        {/* Center: Grade Level Filter */}
        {viewGrouping === 'departments' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              Grado:
            </span>
            <div
              className={`p-0.5 rounded-lg border flex items-center ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#0a0c10] border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setGradeFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  gradeFilter === 'ALL'
                    ? 'bg-sky-500 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter(1)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  gradeFilter === 1
                    ? 'bg-sky-500 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1º Grado
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter(2)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  gradeFilter === 2
                    ? 'bg-sky-500 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2º Grado
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter(3)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  gradeFilter === 3
                    ? 'bg-sky-500 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3º Grado
              </button>
            </div>
          </div>
        )}

        {/* Right: Chart Stacking & Sorting */}
        <div className="flex items-center space-x-2">
          {viewGrouping === 'departments' && (
            <div
              className={`p-0.5 rounded-lg border flex items-center ${
                isLight ? 'bg-white border-slate-300' : 'bg-[#0a0c10] border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setChartType('stacked')}
                title="Apilar horas por 1º, 2º y 3º grado"
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  chartType === 'stacked'
                    ? 'bg-indigo-600 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Apilado (Grados)
              </button>
              <button
                type="button"
                onClick={() => setChartType('total')}
                title="Visualizar barra única con el total acumulado"
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  chartType === 'total'
                    ? 'bg-indigo-600 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Barra Simple
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`text-xs font-bold py-1 px-2.5 rounded-lg border outline-hidden cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700'
                  : 'bg-[#0a0c10] border-slate-800 text-slate-200'
              }`}
            >
              <option value="hours_desc">Mayor Carga (Horas ↓)</option>
              <option value="hours_asc">Menor Carga (Horas ↑)</option>
              <option value="name">Alfabético (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Card */}
      <div
        className={`p-6 rounded-2xl border shadow-xl transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-[#111318] border-slate-800/90 shadow-black/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>
                {viewGrouping === 'departments'
                  ? 'Distribución de Horas por Área de Asignatura'
                  : 'Distribución de Horas por Campos Formativos SEP'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Visualización comparativa de carga horaria acumulada en los 24 grupos de la escuela
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-bold">
            {chartType === 'stacked' && viewGrouping === 'departments' ? (
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-sky-500" />
                  <span className="text-slate-400">1º Grado</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-400">2º Grado</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-violet-500" />
                  <span className="text-slate-400">3º Grado</span>
                </span>
              </div>
            ) : (
              <span className="text-amber-400 font-extrabold">
                Total Asignado: {totalSchoolHours} hrs lectivas
              </span>
            )}
          </div>
        </div>

        {/* Responsive Recharts Container */}
        <div className="w-full h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 25, left: 10, bottom: 45 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isLight ? '#e2e8f0' : '#1e293b'}
              />
              <XAxis
                dataKey="name"
                tick={{
                  fill: isLight ? '#475569' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
                interval={0}
                angle={-25}
                textAnchor="end"
                stroke={isLight ? '#cbd5e1' : '#334155'}
              />
              <YAxis
                tick={{
                  fill: isLight ? '#475569' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
                stroke={isLight ? '#cbd5e1' : '#334155'}
                label={{
                  value: 'Horas Semanales Asignadas',
                  angle: -90,
                  position: 'insideLeft',
                  fill: isLight ? '#64748b' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 700,
                  offset: 0,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: 15,
                  fontSize: 11,
                  color: isLight ? '#475569' : '#94a3b8',
                }}
              />

              {viewGrouping === 'departments' && chartType === 'stacked' ? (
                <>
                  <Bar
                    dataKey="horas1"
                    name="1º Grado"
                    stackId="a"
                    fill="#0ea5e9"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="horas2"
                    name="2º Grado"
                    stackId="a"
                    fill="#6366f1"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="horas3"
                    name="3º Grado"
                    stackId="a"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="horasTotales"
                  name="Horas Totales"
                  radius={[6, 6, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Department Breakdown Table */}
      <div
        className={`rounded-2xl border shadow-xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            : 'bg-[#111318] border-slate-800/90 text-slate-100 shadow-black/40'
        }`}
      >
        <div
          className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0c10] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <TableIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide">
              Desglose Detallado por Departamento y Asignatura
            </h3>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar por nombre o maestro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-3 pr-3 py-1.5 text-xs rounded-lg border outline-hidden w-64 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-[#12151e] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-amber-500'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr
                className={`border-b font-black uppercase text-[11px] tracking-tight ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#16181f] text-slate-300 border-slate-800'
                }`}
              >
                <th className="p-3">Departamento / Academia</th>
                <th className="p-3">Campo Formativo SEP</th>
                <th className="p-3 text-center">1º Grado</th>
                <th className="p-3 text-center">2º Grado</th>
                <th className="p-3 text-center">3º Grado</th>
                <th className="p-3 text-center font-black text-amber-400">Total Horas</th>
                <th className="p-3 text-center">% Currículo</th>
                <th className="p-3 text-center">Grupos</th>
                <th className="p-3">Plantilla Docente Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDepartments.map((dept) => (
                <tr
                  key={dept.id}
                  className={`transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                  }`}
                >
                  {/* Department Name with Color Pip */}
                  <td className="p-3 font-bold">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="truncate">{dept.name}</span>
                    </div>
                  </td>

                  {/* Campo Formativo */}
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300'
                      }`}
                    >
                      {dept.campoFormativo}
                    </span>
                  </td>

                  {/* Grade 1 */}
                  <td className="p-3 text-center font-semibold text-slate-400">
                    {dept.grade1Hours > 0 ? `${dept.grade1Hours}h` : '-'}
                  </td>

                  {/* Grade 2 */}
                  <td className="p-3 text-center font-semibold text-slate-400">
                    {dept.grade2Hours > 0 ? `${dept.grade2Hours}h` : '-'}
                  </td>

                  {/* Grade 3 */}
                  <td className="p-3 text-center font-semibold text-slate-400">
                    {dept.grade3Hours > 0 ? `${dept.grade3Hours}h` : '-'}
                  </td>

                  {/* Total Hours Badge */}
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-1 rounded-md font-black text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {dept.totalHours} hrs
                    </span>
                  </td>

                  {/* Percentage Progress Bar */}
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-extrabold text-[11px]">{dept.percentage}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, dept.percentage * 5)}%`,
                            backgroundColor: dept.color,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Groups Count */}
                  <td className="p-3 text-center font-bold text-slate-400">
                    {dept.groupsCount} / 24
                  </td>

                  {/* Teachers Involved */}
                  <td className="p-3 text-slate-300">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {dept.teachers.length > 0 ? (
                        dept.teachers.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-800'
                                : 'bg-[#16181f] border-slate-700/60 text-slate-300'
                            }`}
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sin asignar</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
