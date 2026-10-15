import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  User,
  Sparkles,
  Phone,
} from 'lucide-react';
import {
  getTeacherContactInfo,
  saveTeacherCustomContact,
  resetTeacherContact,
  getTeacherByNameOrAlias,
  formatWhatsAppNumber,
  TeacherContactDetails,
} from '../data/teacherCatalog';
import { WhatsAppIcon } from './TeacherContactBadge';
import { useTheme } from '../context/ThemeContext';

interface EditTeacherContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  onSaved?: (updated: TeacherContactDetails) => void;
}

export const EditTeacherContactModal: React.FC<EditTeacherContactModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  onSaved,
}) => {
  const { isLight } = useTheme();

  const [emailInput, setEmailInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Load existing contact details when opened
  useEffect(() => {
    if (isOpen && teacherName) {
      const current = getTeacherContactInfo(teacherName);
      setEmailInput(current.email || '');
      setWhatsappInput(current.whatsapp || '');
      setSuccessNotice(null);
    }
  }, [isOpen, teacherName]);

  const teacher = useMemo(() => getTeacherByNameOrAlias(teacherName), [teacherName]);
  const canonicalName = teacher?.name || teacherName;

  // Real-time generated preview links
  const preview = useMemo(() => {
    const cleanMail = emailInput.trim();
    const { displayPhone, waCleanNumber } = formatWhatsAppNumber(whatsappInput);

    const subjectEnc = encodeURIComponent(`Aviso Escolar - Secundaria General 129`);
    const bodyEnc = encodeURIComponent(`Estimado(a) Prof. ${canonicalName}:\n\n`);
    const mailtoUrl = `mailto:${cleanMail || 'docente@secundaria129.edu.mx'}?subject=${subjectEnc}&body=${bodyEnc}`;

    const waTextEnc = encodeURIComponent(`Hola Prof. ${canonicalName}, le contacto de la Secundaria General 129:`);
    const waUrl = `https://wa.me/${waCleanNumber}?text=${waTextEnc}`;

    return {
      cleanMail,
      displayPhone,
      waCleanNumber,
      mailtoUrl,
      waUrl,
    };
  }, [emailInput, whatsappInput, canonicalName]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveTeacherCustomContact(teacherName, emailInput, whatsappInput);
    setSuccessNotice('✓ Datos de contacto guardados y actualizados en toda la plataforma.');

    if (onSaved) {
      onSaved(updated);
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetToDefault = () => {
    if (confirm(`¿Restablecer el correo y WhatsApp del Prof. ${canonicalName} a los datos predeterminados de la escuela?`)) {
      resetTeacherContact(teacherName);
      const restored = getTeacherContactInfo(teacherName);
      setEmailInput(restored.email || '');
      setWhatsappInput(restored.whatsapp || '');
      setSuccessNotice('✓ Contacto restablecido a los valores oficiales.');
      if (onSaved) {
        onSaved(restored);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        className={`rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden flex flex-col transition-all ${
          isLight
            ? 'bg-white border-slate-300 text-slate-800'
            : 'bg-[#12141a] border-slate-800 text-slate-100 shadow-slate-950/60'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d0f15] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Editar Datos de Contacto Directo</h3>
              <p className="text-xs text-slate-400">Prof. <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{canonicalName}</strong></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Metadata Badges */}
          <div
            className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl border text-[11px] ${
              isLight
                ? 'bg-slate-100/80 border-slate-200 text-slate-600'
                : 'bg-[#161922] border-slate-800 text-slate-400'
            }`}
          >
            <span className="font-semibold text-slate-300">Detalles:</span>
            <span className="px-2 py-0.5 rounded font-mono bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {teacher?.payrollId || 'RFC-PENDIENTE'}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {teacher?.mainSubject || 'Especialidad General'}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {teacher?.contractHours || 0} hrs contrato
            </span>
          </div>

          {successNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Email Input Field */}
          <div className="space-y-1.5">
            <label className="block font-bold text-xs flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Correo Electrónico (Email)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Institucional o Personal</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ejemplo.docente@secundaria129.edu.mx"
                required
                className={`w-full px-3.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 rounded-lg text-xs font-mono transition-all border outline-none touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-[#0a0c10] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Se utilizará en los enlaces de redacción directa (<code className="font-mono text-blue-400">mailto:</code>) y correos masivos de plantilla.
            </p>
          </div>

          {/* WhatsApp Input Field */}
          <div className="space-y-1.5">
            <label className="block font-bold text-xs flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Número de WhatsApp / Teléfono</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Formato Internacional</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="+52 55 4123 0100"
                required
                className={`w-full px-3.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 rounded-lg text-xs font-mono transition-all border outline-none touch-manipulation ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-[#0a0c10] border-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Puede escribir los 10 dígitos locales (ej. <code className="font-mono text-emerald-400">55 1234 5678</code>) o con clave de país (<code className="font-mono text-emerald-400">+52 ...</code>). El sistema lo adapta automáticamente.
            </p>
          </div>

          {/* Interactive Live Preview Box */}
          <div
            className={`p-3 rounded-xl border space-y-2 ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0c0e14] border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Vista Previa de Enlaces Directos</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Actualización en tiempo real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Mailto test preview button */}
              <a
                href={preview.mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 sm:p-2 min-h-[40px] sm:min-h-0 rounded-lg border flex items-center justify-between transition-all group active:scale-98 touch-manipulation ${
                  isLight
                    ? 'bg-white hover:bg-blue-50 border-slate-200 text-slate-700'
                    : 'bg-[#151821] hover:bg-blue-950/40 border-slate-700/80 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-mono text-[11px] sm:text-[10px] truncate max-w-[130px]">
                    {preview.cleanMail || 'Sin correo'}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
              </a>

              {/* WhatsApp test preview button */}
              <a
                href={preview.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 sm:p-2 min-h-[40px] sm:min-h-0 rounded-lg border flex items-center justify-between transition-all group active:scale-98 touch-manipulation ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
                    : 'bg-[#0e1814] hover:bg-emerald-950/50 border-emerald-900/60 text-emerald-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono text-[11px] sm:text-[10px] font-bold truncate max-w-[130px]">
                    {preview.displayPhone}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
              </a>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 touch-manipulation">
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Restablecer valores originales"
              className={`flex items-center space-x-1 px-3 py-2 min-h-[40px] sm:min-h-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
                isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Por Defecto</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3.5 py-2 min-h-[40px] sm:min-h-0 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 min-h-[40px] sm:min-h-0 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
