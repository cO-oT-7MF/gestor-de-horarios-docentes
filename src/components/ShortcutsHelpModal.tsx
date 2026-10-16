import React from 'react';
import {
  X,
  Keyboard,
  Save,
  RotateCcw,
  RotateCw,
  Printer,
  Download,
  Sparkles,
  Calendar,
  Users,
  Grid,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ModalPortal } from './ModalPortal';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isLight } = useTheme();

  if (!isOpen) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      category: 'Acciones Frecuentes',
      shortcuts: [
        {
          keys: [modKey, 'S'],
          label: 'Guardado manual inmediato',
          description: 'Guarda en almacenamiento local y genera punto de respaldo seguro.',
          icon: <Save className="w-4 h-4 text-amber-400" />,
        },
        {
          keys: [modKey, 'Z'],
          label: 'Deshacer último cambio',
          description: 'Revierte la última modificación realizada en la malla de horarios.',
          icon: <RotateCcw className="w-4 h-4 text-blue-400" />,
        },
        {
          keys: [modKey, 'Y'],
          alternative: [modKey, 'Shift', 'Z'],
          label: 'Rehacer cambio',
          description: 'Restaura la acción que acabas de deshacer.',
          icon: <RotateCw className="w-4 h-4 text-emerald-400" />,
        },
        {
          keys: [modKey, 'K'],
          label: 'Abrir Copiloto Operativo Escolar IA',
          description: 'Abre el chat inteligente para optimización, huecos y consultas de plantilla.',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        },
        {
          keys: [modKey, 'Shift', 'A'],
          label: 'Auto-Ajustar horarios',
          description: 'Ejecuta el algoritmo de resolución fluida de empalmes.',
          icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
        },
      ],
    },
    {
      category: 'Navegación entre Pestañas',
      shortcuts: [
        {
          keys: [modKey, '1'],
          label: 'Horarios por Docente',
          description: 'Vista individual por maestro con carga y horas libres.',
          icon: <Calendar className="w-4 h-4 text-indigo-400" />,
        },
        {
          keys: [modKey, '2'],
          label: 'Horarios por Grupo',
          description: 'Vista por grupo escolar (1°A a 3°H).',
          icon: <Users className="w-4 h-4 text-sky-400" />,
        },
        {
          keys: [modKey, '3'],
          label: 'Sábana General',
          description: 'Matriz completa de 24 grupos y 35 periodos semanales.',
          icon: <Grid className="w-4 h-4 text-teal-400" />,
        },
        {
          keys: [modKey, '4'],
          label: 'Carga Académica',
          description: 'Tabla oficial de horas, asignaturas y asesores.',
          icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />,
        },
        {
          keys: [modKey, '5'],
          label: 'Empalmes y Conflictos',
          description: 'Detector de choques docentes o materias duplicadas.',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        },
        {
          keys: [modKey, '6'],
          label: 'Guardias / Horas Libres',
          description: 'Disponibilidad docente para sustituciones y guardias.',
          icon: <Clock className="w-4 h-4 text-purple-400" />,
        },
      ],
    },
    {
      category: 'Diálogos y Herramientas',
      shortcuts: [
        {
          keys: [modKey, 'P'],
          label: 'Imprimir horarios oficiales',
          description: 'Abre el menú de exportación e impresión para PDF.',
          icon: <Printer className="w-4 h-4 text-violet-400" />,
        },
        {
          keys: [modKey, 'E'],
          label: 'Exportar / Importar',
          description: 'Descargar datos en Excel, CSV o respaldos JSON.',
          icon: <Download className="w-4 h-4 text-teal-400" />,
        },
        {
          keys: ['?'],
          alternative: [modKey, '/'],
          label: 'Atajos de teclado',
          description: 'Abre esta ventana de referencia rápida para power users.',
          icon: <Keyboard className="w-4 h-4 text-amber-400" />,
        },
        {
          keys: ['Esc'],
          label: 'Cerrar ventana activa',
          description: 'Cierra cualquier modal o diálogo abierto.',
          icon: <X className="w-4 h-4 text-slate-400" />,
        },
      ],
    },
  ];

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Atajos de teclado"
    >
      <div
        className={`relative z-[10000] w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/50'
            : 'bg-[#0f1117] border-slate-800 text-slate-100 shadow-black/80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/60 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                Atajos de Teclado
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Power Users
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Optimiza tu flujo de trabajo y administra horarios con máxima rapidez
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>{group.category}</span>
                <span className="h-px bg-slate-800 grow" />
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-[#141720] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        {sc.icon}
                        <span className="text-xs font-bold leading-tight">
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className={`px-1.5 py-0.5 text-[11px] font-black rounded-md border shadow-2xs ${
                              isLight
                                ? 'bg-white border-slate-300 text-slate-800'
                                : 'bg-slate-900 border-slate-700 text-amber-300'
                            }`}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {sc.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">Esc</kbd> o <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">?</kbd> para cerrar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
