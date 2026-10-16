import React, { useState, useEffect } from 'react';
import { SchoolInfo, TimeSlotConfig } from '../types';
import {
  TIME_SLOTS_VESPERTINO,
  TIME_SLOTS_MATUTINO,
} from '../data/initialData';
import {
  X,
  School,
  Sun,
  Moon,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  onUpdateSchoolInfo?: (info: SchoolInfo) => void;
  setSchoolInfo?: (info: SchoolInfo | ((prev: SchoolInfo) => SchoolInfo)) => void;
  customTimeSlots?: TimeSlotConfig[];
  onUpdateTimeSlots?: (slots: TimeSlotConfig[]) => void;
  onRestoreInitialValues?: () => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  onUpdateSchoolInfo,
  setSchoolInfo,
  customTimeSlots,
  onUpdateTimeSlots,
  onRestoreInitialValues,
}) => {
  const [formData, setFormData] = useState<SchoolInfo>({ ...schoolInfo });
  const [slotsData, setSlotsData] = useState<TimeSlotConfig[]>(() => {
    if (customTimeSlots && customTimeSlots.length === 7) {
      return [...customTimeSlots];
    }
    return schoolInfo.shift.toUpperCase().includes('MATUTINO')
      ? [...TIME_SLOTS_MATUTINO]
      : [...TIME_SLOTS_VESPERTINO];
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...schoolInfo });
      if (customTimeSlots && customTimeSlots.length === 7) {
        setSlotsData([...customTimeSlots]);
      } else {
        setSlotsData(
          schoolInfo.shift.toUpperCase().includes('MATUTINO')
            ? [...TIME_SLOTS_MATUTINO]
            : [...TIME_SLOTS_VESPERTINO]
        );
      }
    }
  }, [isOpen, schoolInfo, customTimeSlots]);

  if (!isOpen) return null;

  const handleShiftSelect = (shift: 'TURNO VESPERTINO' | 'TURNO MATUTINO') => {
    setFormData((prev) => ({ ...prev, shift }));
    if (shift === 'TURNO VESPERTINO') {
      setSlotsData([...TIME_SLOTS_VESPERTINO]);
    } else {
      setSlotsData([...TIME_SLOTS_MATUTINO]);
    }
  };

  const handleSlotTimeChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setSlotsData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolInfo) {
      onUpdateSchoolInfo(formData);
    } else if (setSchoolInfo) {
      setSchoolInfo(formData);
    }
    if (onUpdateTimeSlots) {
      onUpdateTimeSlots(slotsData);
    }
    onClose();
  };

  const isVespertino = formData.shift.toUpperCase().includes('VESPERTINO');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-[#111318] rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[85vh] sm:max-h-[80dvh] shadow-2xl border border-slate-800/90 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#0a0c10] border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-serif">
              Configuración del Plantel y Turno Escolar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Shift Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Turno Escolar Oficial
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleShiftSelect('TURNO VESPERTINO')}
                className={`p-4 rounded-xl border flex flex-col items-start transition-all ${
                  isVespertino
                    ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/20 text-amber-300'
                    : 'bg-[#16181f] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 w-full justify-between mb-1">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Turno Vespertino</span>
                  </div>
                  {isVespertino && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                      ACTIVO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Horario de 13:00 a 18:00 hrs (7 módulos de 40 min con recesos escalonados de 15:00 a 16:00)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleShiftSelect('TURNO MATUTINO')}
                className={`p-4 rounded-xl border flex flex-col items-start transition-all ${
                  !isVespertino
                    ? 'bg-blue-500/15 border-blue-500/60 ring-2 ring-blue-500/20 text-blue-300'
                    : 'bg-[#16181f] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 w-full justify-between mb-1">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Turno Matutino</span>
                  </div>
                  {!isVespertino && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-black">
                      ACTIVO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Horario de 07:00 a 12:00 hrs (7 módulos de 40 min con recesos escalonados)
                </p>
              </button>
            </div>
          </div>

          {/* School Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              Datos Oficiales para Cédulas y Reportes
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre de la Institución
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ciclo Escolar
                </label>
                <input
                  type="text"
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  placeholder="CICLO ESCOLAR 2026-2027"
                  className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Clave C.T.
                </label>
                <input
                  type="text"
                  value={formData.workCenterKey}
                  onChange={(e) => setFormData({ ...formData, workCenterKey: e.target.value })}
                  placeholder="CT 19EES0129S"
                  className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Zona Escolar
                </label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="ZONA ESCOLAR 34"
                  className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Unidad Regional
                </label>
                <input
                  type="text"
                  value={formData.regionalUnit}
                  onChange={(e) => setFormData({ ...formData, regionalUnit: e.target.value })}
                  placeholder="UNIDAD REGIONAL 6"
                  className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Staggered Breaks Info for Vespertino */}
          {isVespertino && (
            <div className="p-4 bg-[#141720] border border-amber-500/20 rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Distribución de Recesos Escalonados de 20 min (15:00 - 16:00 hrs)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Durante la franja de 3:00 PM a 4:00 PM, los recesos se distribuyen de forma escalonada para optimizar los espacios escolares y la supervisión docente:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
                  <div className="font-bold text-amber-300 text-xs">1º Grado</div>
                  <div className="text-[11px] font-semibold text-slate-200 mt-0.5">15:00 - 15:20</div>
                  <div className="text-[10px] text-slate-400 mt-1">Clase posterior: 15:20 a 16:00 (40 min)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40">
                  <div className="font-bold text-sky-300 text-xs flex items-center gap-1">
                    <span>2º Grado</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-200 px-1 rounded">Dividida</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200 mt-0.5">15:20 - 15:40</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    20m clase (15:00-15:20) + 20m receso + 20m clase (15:40-16:00)
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                  <div className="font-bold text-emerald-300 text-xs">3º Grado</div>
                  <div className="text-[11px] font-semibold text-slate-200 mt-0.5">15:40 - 16:00</div>
                  <div className="text-[10px] text-slate-400 mt-1">Clase previa: 15:00 a 15:40 (40 min)</div>
                </div>
              </div>
            </div>
          )}

          {/* Module Times Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horarios por Módulo (7 Horas Lectivas)</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (isVespertino) {
                    setSlotsData([...TIME_SLOTS_VESPERTINO]);
                  } else {
                    setSlotsData([...TIME_SLOTS_MATUTINO]);
                  }
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer Módulos SEP</span>
              </button>
            </div>

            <div className="space-y-2">
              {slotsData.map((slot, idx) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-2.5 bg-[#16181f] border border-slate-800/80 rounded-lg text-xs gap-3"
                >
                  <span className="font-bold text-slate-200 w-20 shrink-0">
                    {slot.name}
                  </span>
                  <div className="flex items-center space-x-2 grow justify-end">
                    <span className="text-slate-500 font-mono text-[11px]">Inicio:</span>
                    <input
                      type="text"
                      value={slot.startTime}
                      onChange={(e) => handleSlotTimeChange(idx, 'startTime', e.target.value)}
                      className="w-20 bg-[#0a0a0a] border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-slate-100 font-bold focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-slate-500 font-mono text-[11px]">— Fin:</span>
                    <input
                      type="text"
                      value={slot.endTime}
                      onChange={(e) => handleSlotTimeChange(idx, 'endTime', e.target.value)}
                      className="w-20 bg-[#0a0a0a] border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-slate-100 font-bold focus:ring-1 focus:ring-amber-500"
                    />
                    {slot.isRecessAfter && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full shrink-0">
                        + Receso escolar
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated System Reset & Factory Maintenance Section (Safely isolated) */}
          {onRestoreInitialValues && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Mantenimiento y Restauración del Sistema
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRestoreInitialValues();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/30 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Valores de Fábrica...</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Restaura la malla horaria y la carga académica oficial predeterminada de la Secundaria 129. Esta acción requiere confirmación de seguridad explícita para evitar pérdidas involuntarias.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-[#16181f] rounded-lg transition-colors border border-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
