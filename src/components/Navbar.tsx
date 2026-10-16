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
  onToggleCopilot?: () => void;
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
  onToggleCopilot,
}) => {
  const { theme, isLight, toggleTheme } = useTheme();
  const [isOperationsMenuOpen, setIsOperationsMenuOpen] = React.useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = React.useState(false);
  const operationsMenuRef = React.useRef<HTMLDivElement>(null);
  const fileMenuRef = React.useRef<HTMLDivElement>(null);
  const [operationsMenuAlign, setOperationsMenuAlign] = React.useState<'left' | 'right'>('right');
  const [fileMenuAlign, setFileMenuAlign] = React.useState<'left' | 'right'>('right');

  // Dynamically detect if menu button is on the left or right of viewport to prevent off-screen clipping
  React.useEffect(() => {
    if (isOperationsMenuOpen && operationsMenuRef.current) {
      const rect = operationsMenuRef.current.getBoundingClientRect();
      setOperationsMenuAlign(rect.left < window.innerWidth / 2 ? 'left' : 'right');
    }
  }, [isOperationsMenuOpen]);

  React.useEffect(() => {
    if (isFileMenuOpen && fileMenuRef.current) {
      const rect = fileMenuRef.current.getBoundingClientRect();
      setFileMenuAlign(rect.left < window.innerWidth / 2 ? 'left' : 'right');
    }
  }, [isFileMenuOpen]);

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
                className={`fixed inset-x-0 mx-4 top-16 sm:absolute sm:top-full sm:inset-auto sm:mt-2 ${
                  operationsMenuAlign === 'left' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
                } sm:mx-0 w-auto sm:w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[440px] max-h-[85vh] sm:max-h-[80dvh] flex flex-col rounded-2xl shadow-2xl border p-4 sm:p-5 z-50 animate-in fade-in slide-in-from-top-2 touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80 ring-1 ring-slate-900/5'
                    : 'bg-[#12151e] border-slate-700/80 text-slate-100 shadow-black/90 ring-1 ring-white/10'
                }`}
              >
                {/* Header */}
                <div className="px-2 py-2 border-b border-slate-700/40 mb-3.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Operaciones del Horario Escolar
                      </p>
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                        Generación automática, auto-ajuste de empalmes y carga docente
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                    Sec. 129
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {/* Generar Horarios */}
                  {onOpenGenerateModal && (
                    <button
                      type="button"
                      id="opt-generate-schedule"
                      onClick={() => handleOperationAction(onOpenGenerateModal)}
                      className={`w-full flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300'
                          : 'bg-[#181c28]/80 hover:bg-emerald-950/30 border-slate-700/70 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                            Generar Horarios
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                            Recomendado
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>
                          Asigna automáticamente los 35 módulos semanales para los 24 grupos y 41 docentes activos conforme a la matriz oficial.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Auto-Ajustar Horarios */}
                  <button
                    type="button"
                    id="opt-auto-solve"
                    onClick={() => handleOperationAction(onAutoSolve)}
                    className={`w-full flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300'
                        : 'bg-[#181c28]/80 hover:bg-blue-950/30 border-slate-700/70 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0 mt-0.5">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                          Auto-Ajustar Horarios
                        </span>
                        {conflictCount > 0 ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse shrink-0">
                            {conflictCount} empalmes
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30 shrink-0">
                            Optimizar
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>
                        {conflictCount > 0
                          ? `Resuelve automáticamente los ${conflictCount} empalmes detectados sin romper nombramientos ni contratos.`
                          : 'Reorganiza huecos libres y balancea la carga académica sin generar empalmes en la plantilla.'}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Sub-section: Carga Docente */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-700/40">
                  <div className="px-2 py-1 mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>Gestión de Carga Docente</span>
                    <Upload className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      id="opt-new-cycle"
                      onClick={() => handleUploadOptionClick('new_cycle')}
                      className={`w-full flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300'
                          : 'bg-[#181c28]/80 hover:bg-amber-950/30 border-slate-700/70 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 mt-0.5">
                        <CalendarPlus className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm sm:text-base font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          Iniciar nuevo ciclo escolar
                        </span>
                        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>
                          Cargar documento oficial de asignación docente para estructurar la malla horaria completa.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="opt-add-teacher"
                      onClick={() => handleUploadOptionClick('add_teacher')}
                      className={`w-full flex items-start space-x-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-50 hover:bg-sky-50 border-slate-200 hover:border-sky-300'
                          : 'bg-[#181c28]/80 hover:bg-sky-950/30 border-slate-700/70 hover:border-sky-500/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 mt-0.5">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm sm:text-base font-bold block mb-1 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          Agregar nuevo docente
                        </span>
                        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-200'}`}>
                          Inserta módulos en huecos libres sin desacomodar las materias existentes de los grupos escolares.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Maintenance Section */}
                <div className="pt-3 mt-3 border-t border-slate-700/40">
                  <button
                    type="button"
                    id="opt-reset-factory"
                    onClick={() => handleUploadOptionClick('reset_initial')}
                    className={`w-full flex items-center space-x-3.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isLight
                        ? 'bg-orange-50 hover:bg-orange-100 border-orange-200'
                        : 'bg-orange-950/20 hover:bg-orange-950/40 border-orange-500/30'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-500 dark:text-orange-400 shrink-0 border border-orange-500/30 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold block text-orange-600 dark:text-orange-400">
                        Restablecer valores iniciales...
                      </span>
                      <p className={`text-xs leading-snug truncate ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                        Plantilla base oficial de la Secundaria 129
                      </p>
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
                className={`fixed inset-x-0 mx-4 top-16 sm:absolute sm:top-full sm:inset-auto sm:mt-2 ${
                  fileMenuAlign === 'left' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
                } sm:mx-0 w-auto sm:w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[440px] max-h-[85vh] sm:max-h-[80dvh] flex flex-col rounded-2xl shadow-2xl border p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-top-2 touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80 ring-1 ring-slate-900/5'
                    : 'bg-[#12151e] border-slate-700/80 text-slate-100 shadow-black/90 ring-1 ring-white/10'
                }`}
              >
                <div className="px-3 py-2 border-b border-slate-700/50 mb-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-2">
                    <FolderDown className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Archivo y Documentos
                      </p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        Respaldo, impresión y exportación
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold">
                    Salidas
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {/* Guardar Horario */}
                  {onManualAutoSave && (
                    <button
                      type="button"
                      id="opt-save-schedule"
                      onClick={() => handleFileAction(onManualAutoSave)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        hasUnsavedChanges
                          ? isLight
                            ? 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-300'
                            : 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-500/40'
                          : isLight
                          ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                          : 'bg-[#181c28]/70 hover:bg-slate-800/80 border-slate-800'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl shrink-0 mt-0.5 border flex items-center justify-center ${
                          hasUnsavedChanges
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-sm font-bold ${
                              hasUnsavedChanges ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-900' : 'text-slate-100'
                            }`}
                          >
                            {hasUnsavedChanges ? 'Guardar Cambios *' : 'Guardar Horario'}
                          </span>
                          <kbd
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Ctrl+S
                          </kbd>
                        </div>
                        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                          {hasUnsavedChanges
                            ? 'Hay modificaciones pendientes por guardar en almacenamiento.'
                            : lastSavedTimestamp
                            ? `Respaldo sincronizado (${new Date(lastSavedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`
                            : 'Guardar copia de seguridad en el navegador.'}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Imprimir Horarios */}
                  <button
                    type="button"
                    id="opt-print-schedule"
                    onClick={() => handleFileAction(onOpenPrintModal)}
                    className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50/80 hover:bg-violet-50/70 border-slate-200 hover:border-violet-300'
                        : 'bg-[#181c28]/70 hover:bg-violet-950/20 border-slate-800 hover:border-violet-500/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 shrink-0 mt-0.5 border border-violet-500/30 flex items-center justify-center">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block mb-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        Imprimir Horarios
                      </span>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                        Formatos oficiales para impresión física o exportación PDF por grupo o docente.
                      </p>
                    </div>
                  </button>

                  {/* Exportar Horarios */}
                  <button
                    type="button"
                    id="opt-export-schedule"
                    onClick={() => handleFileAction(onOpenExportModal)}
                    className={`w-full flex items-start space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-50/80 hover:bg-teal-50/70 border-slate-200 hover:border-teal-300'
                        : 'bg-[#181c28]/70 hover:bg-teal-950/20 border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 shrink-0 mt-0.5 border border-teal-500/30 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block mb-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        Exportar a Excel / CSV / JSON
                      </span>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                        Descarga la sábana completa en hojas de cálculo o genera un respaldo JSON.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Copiloto Operativo Escolar IA Button */}
          {onToggleCopilot && (
            <button
              id="copiloto-ai-btn"
              type="button"
              onClick={onToggleCopilot}
              title="Abrir Copiloto Operativo Escolar IA (Ctrl+K)"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-sm ${
                isLight
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-500/40 shadow-amber-900/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              <span className="font-bold">Copiloto IA</span>
              <kbd className="hidden 2xl:inline text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono text-amber-100">
                Ctrl+K
              </kbd>
            </button>
          )}

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
