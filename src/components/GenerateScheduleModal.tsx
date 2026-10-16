import React, { useState } from 'react';
import { AcademicLoadItem, Group, ScheduleEntry, SchoolInfo } from '../types';
import {
  generateFullScheduleFromWorkload,
  TimetableGenerationResult,
} from '../utils/scheduler';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Grid,
  AlertTriangle,
  Sliders,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicLoads: AcademicLoadItem[];
  groups: Group[];
  schoolInfo: SchoolInfo;
  onApplySchedule: (newEntries: ScheduleEntry[]) => void;
  onNavigateTab: (tab: 'teacher' | 'group' | 'master') => void;
}

import { useTheme } from '../context/ThemeContext';

export const GenerateScheduleModal: React.FC<GenerateScheduleModalProps> = ({
  isOpen,
  onClose,
  academicLoads,
  groups,
  schoolInfo,
  onApplySchedule,
  onNavigateTab,
}) => {
  const { isLight } = useTheme();
  const [preferDoubleBlocks, setPreferDoubleBlocks] = useState(true);
  const [balanceTeacherDaily, setBalanceTeacherDaily] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<TimetableGenerationResult | null>(null);

  if (!isOpen) return null;

  // Calculate stats from academic loads
  let totalWorkloadHours = 0;
  const teacherSet = new Set<string>();
  academicLoads.forEach((load) => {
    Object.values(load.subjects).forEach((s: { teacherName: string; hours: number }) => {
      totalWorkloadHours += s.hours;
      if (s.teacherName) teacherSet.add(s.teacherName);
    });
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    // Use timeout for smooth UI feedback
    setTimeout(() => {
      const result = generateFullScheduleFromWorkload(academicLoads, groups, {
        preferDoubleBlocks,
        balanceTeacherDailyHours: balanceTeacherDaily,
      });
      setLastResult(result);
      setIsGenerating(false);
    }, 400);
  };

  const handleApply = () => {
    if (!lastResult) return;
    onApplySchedule(lastResult.entries);
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Generador Automático de Horarios Escolares"
    >
      <div
        className={`relative z-[10000] w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
            : 'bg-[#111318] border-slate-800 text-slate-100 shadow-black/90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#0a0c10] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">
                Generador Automático de Horarios Escolares
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Construye el horario final, individual y grupal sin empalmes a partir de la Carga Docente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Current Workload Overview Card */}
          <div className="bg-[#16181f] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Datos Base de la Carga Horaria
              </span>
              <span className="text-xs text-amber-400 font-extrabold">
                {schoolInfo.shift}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-black text-slate-100">{academicLoads.length}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Grupos a Horario</div>
              </div>
              <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-black text-amber-400">{teacherSet.size}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Docentes a Programar</div>
              </div>
              <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-black text-emerald-400">{totalWorkloadHours}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Módulos Semanales</div>
              </div>
            </div>
          </div>

          {/* Config Options */}
          {!lastResult && (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Parámetros Pedagógicos de Asignación</span>
              </h4>

              <div className="space-y-2">
                <label className="flex items-start space-x-3 bg-[#16181f] p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={preferDoubleBlocks}
                    onChange={(e) => setPreferDoubleBlocks(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Módulos dobles pedagógicos (2 horas continuas)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Agrupa materias prácticas o de laboratorio (Ciencias, Tecnología, Artes, FCE) en bloques dobles y distribuye materias troncales de 5h (Español, Matemáticas) de forma diaria.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 bg-[#16181f] p-3 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={balanceTeacherDaily}
                    onChange={(e) => setBalanceTeacherDaily(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-700 bg-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Optimización de jornada y compactación de horas docentes
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Minimiza horas puente/libres intermedias y evita sobrecargar a un profesor en un solo día.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Results Display */}
          {lastResult && (
            <div className="bg-[#16181f] border border-slate-800 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-extrabold text-sm text-slate-100">
                    ¡Horarios Generados Satisfactoriamente!
                  </h4>
                </div>
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-xs font-black">
                  0 Empalmes Críticos
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-slate-800">
                  <div className="text-xl font-black text-amber-400">
                    {lastResult.totalPlaced} / {lastResult.totalRequired}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">
                    Horas Asignadas (100%)
                  </div>
                </div>
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-slate-800">
                  <div className="text-xl font-black text-emerald-400">24 Grupos</div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">
                    35 Módulos Semanales c/u
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Las asignaciones se aplicarán directamente a la <strong>Sábana General</strong>, a los <strong>Horarios Individuales por Docente</strong> y a los <strong>Horarios Grupales</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0c10] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>

          {!lastResult ? (
            <button
              disabled={isGenerating || academicLoads.length === 0}
              onClick={handleGenerate}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-black transition-all shadow-md ${
                isGenerating
                  ? 'bg-amber-600 text-slate-900 cursor-wait'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/30 cursor-pointer'
              }`}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Optimizando y Asignando Horarios...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generar Asignaciones de Horario</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLastResult(null)}
                className="px-3 py-2 text-xs font-bold text-slate-300 bg-[#16181f] border border-slate-700 rounded-lg hover:bg-slate-800"
              >
                Reconfigurar
              </button>
              <button
                onClick={handleApply}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Aplicar a Todos los Horarios</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
