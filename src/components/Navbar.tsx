import React from 'react';
import {
  Calendar,
  Users,
  Grid,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Printer,
  Download,
  Sparkles,
  School,
  Moon,
  Sun,
  Settings,
  Upload,
  ChevronDown,
  CalendarPlus,
  UserPlus,
  Keyboard,
  ShieldAlert,
  Save,
  Check,
  FolderDown,
  Sliders,
  Shield,
  FileText,
} from 'lucide-react';
import { SchoolInfo, TimeSlotConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability';
  setActiveTab: (tab: 'teacher' | 'group' | 'master' | 'workload' | 'conflicts' | 'availability') => void;
  conflictCount: number;
  schoolInfo: SchoolInfo;
  timeSlots?: TimeSlotConfig[];
  onOpenPrintModal: () => void;
  onOpenExportModal: () => void;
  onOpenSchoolSettings: () => void;
  onToggleShift: (shift: 'TURNO VESPERTINO' | 'TURNO MATUTINO') => void;
  onAutoSolve: () => void;
  onOpenUploadModal?: () => void;
  onOpenGenerateModal?: () => void;
  onRestoreInitialValues?: () => void;
  onSelectUploadOption?: (option: 'new_cycle' | 'add_teacher' | 'reset_initial') => void;
  lastSavedTimestamp?: string | null;
  isAutoSaving?: boolean;
  onManualAutoSave?: () => void;
  hasUnsavedChanges?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenShortcutsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  conflictCount,
  schoolInfo,
  timeSlots,
  onOpenPrintModal,
  onOpenExportModal,
  onOpenSchoolSettings,
  onToggleShift,
  onAutoSolve,
  onOpenUploadModal,
  onOpenGenerateModal,
  onRestoreInitialValues,
  onSelectUploadOption,
  lastSavedTimestamp,
  isAutoSaving,
  onManualAutoSave,
  hasUnsavedChanges = false,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenShortcutsModal,
}) => {
  const { theme, isLight, toggleTheme } = useTheme();
  const [isOperationsMenuOpen, setIsOperationsMenuOpen] = React.useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const operationsMenuRef = React.useRef<HTMLDivElement>(null);
  const fileMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (operationsMenuRef.current && !operationsMenuRef.current.contains(e.target as Node)) {
        setIsOperationsMenuOpen(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUploadOptionClick = (option: 'new_cycle' | 'add_teacher' | 'reset_initial') => {
    setIsOperationsMenuOpen(false);
    if (onSelectUploadOption) {
      onSelectUploadOption(option);
    } else if (option === 'reset_initial' && onRestoreInitialValues) {
      onRestoreInitialValues();
    } else if (onOpenUploadModal) {
      onOpenUploadModal();
    }
  };

  const handleOperationAction = (action: () => void) => {
    setIsOperationsMenuOpen(false);
    action();
  };

  const handleFileAction = (action: () => void) => {
    setIsFileMenuOpen(false);
    action();
  };

  const isVespertino = schoolInfo.shift?.toUpperCase().includes('VESPERTINO');
  const firstSlot = timeSlots?.[0];
  const lastSlot = timeSlots?.[timeSlots.length - 1];
  const timeRangeLabel =
    firstSlot && lastSlot
      ? `${firstSlot.startTime} - ${lastSlot.endTime}`
      : isVespertino
      ? '13:00 - 18:00'
      : '07:00 - 12:00';

  return (
    <header className="bg-[#0c0e12] border-b border-slate-800/90 sticky top-0 z-30 shadow-xl shadow-black/30 transition-colors duration-200">
      {/* Top Banner with School Identity & Shift Selector */}
      <div className="bg-[#06070a] text-slate-300 px-4 py-2 text-xs border-b border-slate-800/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-2 font-medium tracking-wide">
            <School className="w-4 h-4 text-amber-400 shrink-0" />
            <button
              onClick={onOpenSchoolSettings}
              title="Clic para editar datos de la escuela y turno"
              className="font-bold text-amber-300 tracking-normal hover:underline text-left cursor-pointer truncate max-w-[180px] sm:max-w-none"
            >
              {schoolInfo.name}
            </button>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">{schoolInfo.schoolYear}</span>
            <span className="text-slate-700 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline">{schoolInfo.workCenterKey}</span>
            <span className="text-slate-700 hidden lg:inline">|</span>
            <span className="text-slate-400 hidden lg:inline">{schoolInfo.zone}</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
            {/* Theme Toggle Button (Top Quick Switch) */}
            <button
              type="button"
              id="theme-toggle-top-btn"
              onClick={toggleTheme}
              title={isLight ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro de Alta Legibilidad (Para horas diurnas)'}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-extrabold transition-all border cursor-pointer ${
                isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-2xs'
                  : 'bg-[#111318] text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="hidden sm:inline">Modo Claro (Día)</span>
                  <span className="sm:hidden">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="hidden sm:inline">Modo Oscuro</span>
                  <span className="sm:hidden">Oscuro</span>
                </>
              )}
            </button>

            {/* Quick Shift Switcher */}
            <div className="inline-flex rounded-lg bg-[#111318] p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => onToggleShift('TURNO VESPERTINO')}
                title="Cambiar a Turno Vespertino (13:00 - 18:00)"
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-extrabold transition-all ${
                  isVespertino
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span className="hidden md:inline">Turno Vespertino (13:00 - 18:00)</span>
                <span className="md:hidden">Vesp</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleShift('TURNO MATUTINO')}
                title="Cambiar a Turno Matutino (07:00 - 12:00)"
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-extrabold transition-all ${
                  !isVespertino
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span className="hidden md:inline">Turno Matutino (07:00 - 12:00)</span>
                <span className="md:hidden">Mat</span>
              </button>
            </div>

            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
              24 Grupos (1º, 2º y 3º)
            </span>
            <span
              onClick={onOpenSchoolSettings}
              title="Jornada escolar: 13:00 a 18:00 (25 horas reloj semanales) estructurada en 35 módulos lectivos de 40 min con recesos escalonados"
              className={`hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border cursor-pointer ${
                isVespertino
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/60'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
              }`}
            >
              Jornada: {timeRangeLabel} (25 hrs) • 35 Módulos
            </span>

            {/* One-Click Save Button to IndexedDB with Ctrl+S shortcut */}
            <button
              type="button"
              id="one-click-save-button"
              data-testid="auto-save-status-badge"
              onClick={onManualAutoSave}
              title={
                hasUnsavedChanges
                  ? `Hay cambios en el horario sin guardar. Haz clic o presiona 'Ctrl+S' para guardar todo el ciclo y la matriz en IndexedDB.`
                  : `Todo guardado en IndexedDB${
                      lastSavedTimestamp
                        ? ` a las ${new Date(lastSavedTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ''
                    }. Haz clic para respaldar manualmente ahora.`
              }
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-sm ${
                hasUnsavedChanges
                  ? isLight
                    ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/50 hover:bg-amber-200 animate-subtle-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/80 ring-2 ring-amber-400/40 hover:bg-amber-500/30 animate-subtle-pulse'
                  : isAutoSaving
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse'
                  : isLight
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
              }`}
            >
              {hasUnsavedChanges ? (
                <Save className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              ) : isAutoSaving ? (
                <Save className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              )}
              <span className="hidden sm:inline font-black">
                {hasUnsavedChanges
                  ? 'Guardar'
                  : isAutoSaving
                  ? 'Guardando en IndexedDB...'
                  : `Guardado${
                      lastSavedTimestamp
                        ? ` • ${new Date(lastSavedTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : ' en IndexedDB'
                    }`}
              </span>
              <span className="sm:hidden font-black">
                {hasUnsavedChanges ? 'Guardar *' : isAutoSaving ? 'Guardando...' : 'Guardado'}
              </span>
              <kbd className={`hidden md:inline text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                hasUnsavedChanges
                  ? isLight
                    ? 'bg-amber-200 text-amber-950 border border-amber-400/60'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                  : isLight
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
              }`}>
                Ctrl+S
              </kbd>
            </button>

            {/* Keyboard Shortcuts Guide Modal Button */}
            {onOpenShortcutsModal && (
              <button
                type="button"
                id="btn-open-shortcuts-modal"
                onClick={onOpenShortcutsModal}
                title="Ver atajos de teclado para power users (Presiona '?' o Ctrl+/)"
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-300 hover:border-amber-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Atajos</span>
                <kbd className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isLight ? 'bg-white text-slate-600 border border-slate-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  ?
                </kbd>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs with distinct, non-repeating interactive palettes */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 sm:pb-0" id="main-nav-tabs">
          {/* 1. Docentes: Indigo */}
          <button
            id="tab-teacher-btn"
            onClick={() => setActiveTab('teacher')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
              activeTab === 'teacher'
                ? isLight
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300 shadow-xs'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-xs shadow-indigo-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-200'
                : 'text-slate-400 border-transparent hover:text-indigo-300 hover:bg-indigo-950/30 hover:border-indigo-800/40'
            }`}
          >
            <Calendar className={`w-4 h-4 transition-colors ${activeTab === 'teacher' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
            <span>Horarios por Docente</span>
          </button>

          {/* 2. Grupos: Sky / Cyan */}
          <button
            id="tab-group-btn"
            onClick={() => setActiveTab('group')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
              activeTab === 'group'
                ? isLight
                  ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs'
                  : 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-xs shadow-sky-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-sky-800 hover:bg-sky-50 hover:border-sky-200'
                : 'text-slate-400 border-transparent hover:text-sky-300 hover:bg-sky-950/30 hover:border-sky-800/40'
            }`}
          >
            <Users className={`w-4 h-4 transition-colors ${activeTab === 'group' ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-400'}`} />
            <span>Horarios por Grupo</span>
          </button>

          {/* 3. Sábana General: Teal */}
          <button
            id="tab-master-btn"
            onClick={() => setActiveTab('master')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
              activeTab === 'master'
                ? isLight
                  ? 'bg-teal-100 text-teal-900 border-teal-300 shadow-xs'
                  : 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-xs shadow-teal-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-teal-800 hover:bg-teal-50 hover:border-teal-200'
                : 'text-slate-400 border-transparent hover:text-teal-300 hover:bg-teal-950/30 hover:border-teal-800/40'
            }`}
          >
            <Grid className={`w-4 h-4 transition-colors ${activeTab === 'master' ? 'text-teal-400' : 'text-slate-400 group-hover:text-teal-400'}`} />
            <span>Sábana General</span>
          </button>

          {/* 4. Carga Académica: Amber */}
          <button
            id="tab-workload-btn"
            onClick={() => setActiveTab('workload')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
              activeTab === 'workload'
                ? isLight
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs shadow-amber-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-amber-800 hover:bg-amber-50 hover:border-amber-200'
                : 'text-slate-400 border-transparent hover:text-amber-300 hover:bg-amber-950/30 hover:border-amber-800/40'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 transition-colors ${activeTab === 'workload' ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
            <span>Carga Académica</span>
          </button>

          {/* 5. Empalmes: Rose */}
          <button
            id="tab-conflicts-btn"
            onClick={() => setActiveTab('conflicts')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 relative ${
              activeTab === 'conflicts'
                ? isLight
                  ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs shadow-rose-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-rose-800 hover:bg-rose-50 hover:border-rose-200'
                : 'text-slate-400 border-transparent hover:text-rose-300 hover:bg-rose-950/30 hover:border-rose-800/40'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 transition-colors ${activeTab === 'conflicts' ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'}`} />
            <span>Empalmes</span>
            {conflictCount > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs font-black rounded-full ${
                  activeTab === 'conflicts'
                    ? 'bg-rose-500 text-white'
                    : isLight
                    ? 'bg-rose-200 text-rose-800 border border-rose-300'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/60 animate-pulse'
                }`}
              >
                {conflictCount}
              </span>
            )}
          </button>

          {/* 6. Guardias: Purple */}
          <button
            id="tab-availability-btn"
            onClick={() => setActiveTab('availability')}
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer active:scale-95 ${
              activeTab === 'availability'
                ? isLight
                  ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-xs shadow-purple-950/20'
                : isLight
                ? 'text-slate-600 border-transparent hover:text-purple-800 hover:bg-purple-50 hover:border-purple-200'
                : 'text-slate-400 border-transparent hover:text-purple-300 hover:bg-purple-950/30 hover:border-purple-800/40'
            }`}
          >
            <Shield className={`w-4 h-4 transition-colors ${activeTab === 'availability' ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} />
            <span>Guardias</span>
          </button>
        </nav>

        {/* Global Action Menus Reorganized into Operaciones & Archivo Dropdowns + System Tools */}
        <div className="flex items-center space-x-2">
          {/* MENU 1: OPERACIONES DROPDOWN (Generar, Auto-Ajustar, Carga Horaria) */}
          <div className="relative" ref={operationsMenuRef}>
            <button
              id="operations-menu-btn"
              type="button"
              onClick={() => {
                setIsOperationsMenuOpen((prev) => !prev);
                setIsFileMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                isOperationsMenuOpen
                  ? isLight
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : conflictCount > 0
                  ? isLight
                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-xs'
                    : 'bg-blue-900/60 text-blue-200 border-blue-600 hover:bg-blue-800/60 shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'
                  : 'bg-[#12151e] hover:bg-[#181c28] text-slate-200 border-slate-700/80 shadow-xs'
              }`}
              title="Menú de Operaciones: Generar Horarios, Auto-Ajustar y Gestión de Carga Docente"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Operaciones</span>
              {conflictCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isOperationsMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isOperationsMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl border p-2 z-50 animate-in fade-in slide-in-from-top-2 touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                    : 'bg-[#12151e] border-slate-800 text-slate-100 shadow-black/80'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-slate-700/40 mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                    Operaciones del Horario
                  </p>
                  <span className="text-[10px] text-slate-400">Algoritmo Sec. 129</span>
                </div>

                <div className="space-y-1">
                  {/* Generar Horarios */}
                  {onOpenGenerateModal && (
                    <button
                      type="button"
                      id="opt-generate-schedule"
                      onClick={() => handleOperationAction(onOpenGenerateModal)}
                      className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-emerald-50' : 'hover:bg-emerald-500/10'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-500">
                            Generar Horarios
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            Recomendado
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                          Asigna automáticamente los 35 módulos para los 24 grupos y 41 docentes activos.
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Auto-Ajustar Horarios */}
                  <button
                    type="button"
                    id="opt-auto-solve"
                    onClick={() => handleOperationAction(onAutoSolve)}
                    className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-blue-50' : 'hover:bg-blue-500/10'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-blue-500/15 text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-400">
                          Auto-Ajustar Horarios
                        </span>
                        {conflictCount > 0 ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold animate-pulse">
                            {conflictCount} empalmes
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                            Optimizar
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        {conflictCount > 0
                          ? `Resuelve automáticamente los ${conflictCount} empalmes detectados.`
                          : 'Reorganiza huecos libres y balancea la carga académica sin empalmes.'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Sub-section: Carga Docente */}
                <div className="pt-2 mt-2 border-t border-slate-700/60">
                  <div className="px-2 py-0.5 mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Cargar Carga Académica</span>
                    <Upload className="w-3 h-3 text-amber-400" />
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      id="opt-new-cycle"
                      onClick={() => handleUploadOptionClick('new_cycle')}
                      className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
                        <CalendarPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200">
                          Iniciar nuevo ciclo escolar
                        </span>
                        <span className="text-[11px] text-slate-400 leading-tight block">
                          Cargar documento de asignación docente y recrear la malla completa.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="opt-add-teacher"
                      onClick={() => handleUploadOptionClick('add_teacher')}
                      className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="p-1.5 rounded-md bg-sky-500/15 text-sky-400 shrink-0 mt-0.5 border border-sky-500/30">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-slate-200">
                          Agregar nuevo docente
                        </span>
                        <span className="text-[11px] text-slate-400 leading-tight block">
                          Inserta módulos en huecos libres sin desacomodar las materias existentes.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Maintenance Section */}
                <div className="pt-2 mt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    id="opt-reset-factory"
                    onClick={() => handleUploadOptionClick('reset_initial')}
                    className={`w-full flex items-center space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-orange-50' : 'hover:bg-orange-500/10'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-orange-500/15 text-orange-400 shrink-0 border border-orange-500/30">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold block text-orange-400">
                        Restablecer valores iniciales...
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Plantilla base oficial de la Secundaria 129
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MENU 2: ARCHIVO DROPDOWN (Guardar, Imprimir, Exportar) */}
          <div className="relative" ref={fileMenuRef}>
            <button
              id="file-menu-btn"
              type="button"
              onClick={() => {
                setIsFileMenuOpen((prev) => !prev);
                setIsOperationsMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                isFileMenuOpen
                  ? isLight
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-200 text-slate-950 border-white shadow-sm'
                  : hasUnsavedChanges
                  ? isLight
                    ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/70 ring-2 ring-amber-400/30 shadow-xs'
                  : isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'
                  : 'bg-[#12151e] hover:bg-[#181c28] text-slate-200 border-slate-700/80 shadow-xs'
              }`}
              title="Menú de Archivo: Guardar cambios, Imprimir y Exportar a Excel/CSV/JSON"
            >
              <FolderDown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Archivo</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isFileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isFileMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl border p-2 z-50 animate-in fade-in slide-in-from-top-2 touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                    : 'bg-[#12151e] border-slate-800 text-slate-100 shadow-black/80'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-slate-700/40 mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                    Archivo y Documentos
                  </p>
                  <span className="text-[10px] text-slate-400">Salidas</span>
                </div>

                <div className="space-y-1">
                  {/* Guardar Horario */}
                  {onManualAutoSave && (
                    <button
                      type="button"
                      id="opt-save-schedule"
                      onClick={() => handleFileAction(onManualAutoSave)}
                      className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        hasUnsavedChanges
                          ? isLight
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : 'bg-amber-950/30 hover:bg-amber-950/50'
                          : isLight
                          ? 'hover:bg-slate-100'
                          : 'hover:bg-slate-800/70'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md shrink-0 mt-0.5 border ${
                          hasUnsavedChanges
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black ${
                              hasUnsavedChanges ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          >
                            {hasUnsavedChanges ? 'Guardar Cambios *' : 'Guardar Horario'}
                          </span>
                          <kbd
                            className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                              isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Ctrl+S
                          </kbd>
                        </div>
                        <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                          {hasUnsavedChanges
                            ? 'Hay modificaciones pendientes por guardar en almacenamiento.'
                            : lastSavedTimestamp
                            ? `Respaldo sincronizado (${new Date(lastSavedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
                            : 'Guardar copia de seguridad en el navegador.'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Imprimir Horarios */}
                  <button
                    type="button"
                    id="opt-print-schedule"
                    onClick={() => handleFileAction(onOpenPrintModal)}
                    className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-violet-50' : 'hover:bg-violet-500/10'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-violet-500/15 text-violet-400 shrink-0 mt-0.5 border border-violet-500/30">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold block text-slate-200">
                        Imprimir Horarios
                      </span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Formatos oficiales para impresión física o guardado en PDF por grupo o docente.
                      </span>
                    </div>
                  </button>

                  {/* Exportar Horarios */}
                  <button
                    type="button"
                    id="opt-export-schedule"
                    onClick={() => handleFileAction(onOpenExportModal)}
                    className={`w-full flex items-start space-x-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-teal-50' : 'hover:bg-teal-500/10'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-teal-500/15 text-teal-400 shrink-0 mt-0.5 border border-teal-500/30">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold block text-slate-200">
                        Exportar a Excel / CSV / JSON
                      </span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Descarga la sábana completa en hojas de cálculo o genera un respaldo JSON.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-800/90 hidden sm:block mx-1" />

          {/* Quick Plantel & Theme Buttons */}
          <button
            id="settings-school-btn"
            onClick={onOpenSchoolSettings}
            title="Configurar datos del plantel, turno escolar y módulos SEP"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border-slate-300'
                : 'bg-[#12151e] hover:bg-sky-950/30 text-slate-300 hover:text-sky-200 border-slate-700/80 hover:border-sky-500/50'
            }`}
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span className="hidden xl:inline font-bold">Plantel</span>
          </button>

          <button
            id="theme-toggle-main-btn"
            type="button"
            onClick={toggleTheme}
            title={
              isLight
                ? 'Cambiar a Tema Oscuro Predeterminado'
                : 'Cambiar a Tema Claro de Alto Contraste (Para horas escolares diurnas)'
            }
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
              isLight
                ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100 shadow-2xs'
                : 'bg-[#12151e] text-amber-300 border-slate-700/80 hover:bg-amber-950/30 hover:border-amber-500/50 hover:text-amber-200'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="hidden xl:inline">Tema</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden xl:inline">Tema</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
