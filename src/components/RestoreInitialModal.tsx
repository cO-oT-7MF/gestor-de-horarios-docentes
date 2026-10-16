import React from 'react';
import { RotateCcw, X, AlertCircle, CheckCircle2, School, Calendar, Users, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ModalPortal } from './ModalPortal';

interface RestoreInitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestore: () => void;
}

export const RestoreInitialModal: React.FC<RestoreInitialModalProps> = ({
  isOpen,
  onClose,
  onConfirmRestore,
}) => {
  const { isLight } = useTheme();
  const [confirmedSafety, setConfirmedSafety] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setConfirmedSafety(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Restablecer Valores Iniciales"
    >
      <div
        className={`relative z-[10000] rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:w-[480px] max-h-[90vh] sm:max-h-[85vh] shadow-2xl border overflow-hidden flex flex-col transition-all ${
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
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-serif">Restablecer Valores Iniciales</h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Restaurar la configuración y horarios oficiales de fábrica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isLight
                ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
            <div className="text-xs space-y-1">
              <p className="font-bold">¿Deseas restablecer todos los datos a sus valores iniciales?</p>
              <p className={isLight ? 'text-amber-800' : 'text-amber-300/80'}>
                Esta acción restaurará el sistema a la estructura oficial predeterminada de la Secundaria 129
                y reemplazará cualquier cambio o asignación temporal actual.
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 space-y-2.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161822] border-slate-800'
            }`}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Elementos que se restablecerán:</span>
            </h4>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-center space-x-2">
                <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  <strong>Plantel SEP:</strong> Esc. Sec. Nº 129 "Gral. Félix U. Gómez" (Turno Vespertino)
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  <strong>24 Grupos Escolares:</strong> 1ºA-1ºH, 2ºA-2ºH, 3ºA-3ºH completos
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  <strong>Carga Académica Oficial:</strong> 35 horas semanales por grupo con materias y asesores base
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                  <strong>Malla de Horarios:</strong> Horarios verificados y optimizados sin empalmes
                </span>
              </li>
            </ul>
          </div>

          {/* Safety Checkbox */}
          <label
            htmlFor="confirm-safety-checkbox"
            className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
              confirmedSafety
                ? isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800 text-slate-300'
            }`}
          >
            <input
              type="checkbox"
              id="confirm-safety-checkbox"
              checked={confirmedSafety}
              onChange={(e) => setConfirmedSafety(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
            />
            <span className="text-xs font-semibold leading-relaxed">
              Confirmo que deseo restablecer todos los horarios y la carga docente a los valores oficiales de fábrica (se sobrescribirán cambios no respaldados).
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-end space-x-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0c10] border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:bg-slate-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            id="confirm-restore-initial-btn"
            disabled={!confirmedSafety}
            onClick={() => {
              if (confirmedSafety) {
                onConfirmRestore();
                onClose();
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black shadow-md transition-all ${
              confirmedSafety
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed opacity-50 shadow-none'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer a Valores Iniciales</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
