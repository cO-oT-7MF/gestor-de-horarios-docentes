import React, { useState, useMemo } from 'react';
import {
  Mail,
  Send,
  Copy,
  Check,
  X,
  Users,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { getAllTeacherEmails, getTeacherContactInfo } from '../data/teacherCatalog';
import { useTheme } from '../context/ThemeContext';
import { WhatsAppIcon } from './TeacherContactBadge';

interface MassNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTeachers: string[];
}

export const MassNotificationModal: React.FC<MassNotificationModalProps> = ({
  isOpen,
  onClose,
  allTeachers,
}) => {
  const { isLight } = useTheme();
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState(
    'Aviso Oficial a la Plantilla Docente - Escuela Secundaria General No. 129'
  );
  const [messageBody, setMessageBody] = useState(
    'Estimados(as) Profesores(as):\n\nSe les comunica atentamente la siguiente información oficial respecto a las actividades escolares y horarios...\n\nAtentamente,\nDirección y Subdirección Escolar\nEscuela Secundaria General No. 129'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(allTeachers);

  // Sync selected teachers if allTeachers change
  React.useEffect(() => {
    setSelectedTeachers(allTeachers);
  }, [allTeachers]);

  const teacherContacts = useMemo(() => {
    return allTeachers.map((name) => ({
      name,
      ...getTeacherContactInfo(name),
    }));
  }, [allTeachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchFilter.trim()) return teacherContacts;
    const q = searchFilter.toLowerCase();
    return teacherContacts.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.displayPhone.includes(q)
    );
  }, [teacherContacts, searchFilter]);

  const selectedEmails = useMemo(() => {
    return selectedTeachers
      .map((name) => getTeacherContactInfo(name).email)
      .filter(Boolean);
  }, [selectedTeachers]);

  const massMailtoUrl = useMemo(() => {
    const bccList = selectedEmails.join(',');
    const subEnc = encodeURIComponent(subject);
    const bodyEnc = encodeURIComponent(messageBody);
    return `mailto:direccion.sec129@edomex.nuevaescuelamexicana.mx?bcc=${encodeURIComponent(
      bccList
    )}&subject=${subEnc}&body=${bodyEnc}`;
  }, [selectedEmails, subject, messageBody]);

  const handleCopyBcc = () => {
    navigator.clipboard.writeText(selectedEmails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const toggleSelectTeacher = (name: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeachers.length === allTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(allTeachers);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mass-notification-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40'
            : 'bg-[#10131a] border-slate-800 text-slate-100 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0e14] border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 id="mass-notification-title" className="text-base font-black">
                Comunicación Masiva a la Plantilla Docente
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Envía avisos oficiales a los {allTeachers.length} docentes de la Secundaria 129 con copia oculta (BCC)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Notice Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
              isLight
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
            }`}
          >
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Privacidad Garantizada: Los correos se incluyen en <strong>Copia Oculta (BCC)</strong>.
              </p>
              <p className="text-[11px] opacity-85">
                Al presionar "Abrir en Cliente de Correo", se abrirá tu gestor habitual (Gmail, Outlook, Mail). También puedes copiar la lista completa de direcciones para pegarla directamente en cualquier plataforma.
              </p>
            </div>
          </div>

          {/* Form: Subject and Template */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Asunto del Correo:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-[#090b10] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Contenido / Plantilla del Mensaje:
              </label>
              <textarea
                rows={3}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden transition-all font-mono leading-relaxed ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-[#090b10] border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Recipient Selection Header */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Destinatarios Seleccionados:
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {selectedEmails.length} de {allTeachers.length} docentes
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                >
                  {selectedTeachers.length === allTeachers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
              </div>
            </div>

            {/* Search within recipients */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por docente, correo o teléfono..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border outline-hidden ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    : 'bg-[#090b10] border-slate-700 text-slate-200 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Scrollable list of teachers */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800/60 bg-[#090b10]">
              {filteredTeachers.map((t) => {
                const isSelected = selectedTeachers.includes(t.name);
                return (
                  <div
                    key={t.name}
                    onClick={() => toggleSelectTeacher(t.name)}
                    className={`p-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-blue-50/70 hover:bg-blue-100/60'
                          : 'bg-blue-950/20 hover:bg-blue-900/30'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-900/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row click
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="font-bold text-slate-200 mr-2">{t.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{t.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        {t.displayPhone}
                      </span>
                      <a
                        href={t.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`WhatsApp con ${t.name}`}
                        className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0e14] border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={handleCopyBcc}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-[#161822] hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? '¡Correos Copiados al Portapapeles!' : 'Copiar Todos los Correos (BCC)'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <a
              href={massMailtoUrl}
              onClick={() => {
                // Keep open or notify
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Abrir en Cliente de Correo</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
