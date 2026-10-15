import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Check, Copy, ExternalLink, Edit2 } from 'lucide-react';
import { getTeacherContactInfo, TeacherContactDetails } from '../data/teacherCatalog';
import { useTheme } from '../context/ThemeContext';
import { EditTeacherContactModal } from './EditTeacherContactModal';

interface TeacherContactBadgeProps {
  teacherName: string;
  variant?: 'compact' | 'standard' | 'header';
  className?: string;
  showLabels?: boolean;
  allowEdit?: boolean;
}

/**
 * Clean SVG WhatsApp Icon with official brand color
 */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const TeacherContactBadge: React.FC<TeacherContactBadgeProps> = ({
  teacherName,
  variant = 'standard',
  className = '',
  showLabels = false,
  allowEdit = true,
}) => {
  const { isLight } = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [contactVersion, setContactVersion] = useState(0);

  // Re-fetch contact when teacherName or global updates trigger
  const contact: TeacherContactDetails = getTeacherContactInfo(teacherName);

  // Listen to global contact update events so updates reflect immediately
  useEffect(() => {
    const handleUpdate = () => {
      setContactVersion((v) => v + 1);
    };

    window.addEventListener('sec129_teacher_contacts_updated', handleUpdate);
    return () => {
      window.removeEventListener('sec129_teacher_contacts_updated', handleUpdate);
    };
  }, []);

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  };

  // HEADER VARIANT (for top of TeacherScheduleView)
  if (variant === 'header') {
    return (
      <>
        <div
          className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border transition-all ${
            isLight
              ? 'bg-slate-50/90 border-slate-200'
              : 'bg-[#151821] border-slate-800'
          } ${className}`}
        >
          {/* Email action pill */}
          <div className="flex items-center space-x-1 touch-manipulation">
            <a
              href={contact.mailtoUrl}
              onClick={(e) => e.stopPropagation()}
              title={`Enviar correo electrónico a ${contact.email}`}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md text-xs font-semibold transition-all border group active:scale-95 ${
                isLight
                  ? 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-300 hover:border-blue-300 shadow-2xs'
                  : 'bg-[#0d0f15] hover:bg-blue-950/40 text-slate-300 hover:text-blue-300 border-slate-700 hover:border-blue-500/50 shadow-2xs'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[200px] font-mono text-[11px]">{contact.email}</span>
            </a>

            <button
              type="button"
              onClick={(e) => handleCopy(e, contact.email, 'email')}
              title="Copiar correo"
              className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors cursor-pointer active:scale-95"
            >
              {copied === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <span className="text-slate-600 hidden sm:inline">·</span>

          {/* WhatsApp action pill */}
          <div className="flex items-center space-x-1 touch-manipulation">
            <a
              href={contact.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Abrir chat de WhatsApp con ${contact.teacherName} (${contact.displayPhone})`}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 min-h-[36px] sm:min-h-0 rounded-md text-xs font-semibold transition-all border group active:scale-95 ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                  : 'bg-[#0d1712] hover:bg-emerald-950/50 text-emerald-300 hover:text-emerald-200 border-emerald-800/60 hover:border-emerald-600 shadow-2xs'
              }`}
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-mono text-[11px] font-bold">{contact.displayPhone}</span>
            </a>

            <button
              type="button"
              onClick={(e) => handleCopy(e, contact.whatsapp, 'wa')}
              title="Copiar número de WhatsApp"
              className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 transition-colors cursor-pointer active:scale-95"
            >
              {copied === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Direct Edit Button */}
          {allowEdit && (
            <>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                title={`Modificar correo o WhatsApp de ${contact.teacherName}`}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all border group cursor-pointer ${
                  contact.isCustomized
                    ? isLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border-amber-700/60'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800 border-slate-300'
                    : 'bg-[#0d0f15] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                <Edit2 className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Editar Contacto</span>
                {contact.isCustomized && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Datos personalizados" />
                )}
              </button>
            </>
          )}
        </div>

        {isEditModalOpen && (
          <EditTeacherContactModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            teacherName={teacherName}
            onSaved={() => setContactVersion((v) => v + 1)}
          />
        )}
      </>
    );
  }

  // COMPACT VARIANT (for small table cells or dense lists)
  if (variant === 'compact') {
    return (
      <>
        <div
          className={`inline-flex items-center space-x-1 touch-manipulation ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Email Icon */}
          <a
            href={contact.mailtoUrl}
            onClick={(e) => e.stopPropagation()}
            title={`Redactar correo a ${contact.teacherName}: ${contact.email}`}
            className={`p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-md transition-all hover:scale-105 active:scale-95 ${
              isLight
                ? 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                : 'text-slate-400 hover:text-blue-400 hover:bg-blue-950/40 active:bg-blue-900/60'
            }`}
            aria-label={`Correo a ${contact.email}`}
          >
            <Mail className="w-3.5 h-3.5" />
          </a>

          {/* WhatsApp Icon */}
          <a
            href={contact.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`WhatsApp con ${contact.teacherName}: ${contact.displayPhone}`}
            className={`p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-md transition-all hover:scale-105 active:scale-95 ${
              isLight
                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 active:bg-emerald-900/60'
            }`}
            aria-label={`Chat de WhatsApp con ${contact.displayPhone}`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
          </a>

          {/* Direct Edit Pencil Icon */}
          {allowEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              title={`Modificar datos de contacto de ${contact.teacherName}`}
              className={`p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                contact.isCustomized
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {isEditModalOpen && (
          <EditTeacherContactModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            teacherName={teacherName}
            onSaved={() => setContactVersion((v) => v + 1)}
          />
        )}
      </>
    );
  }

  // STANDARD VARIANT (for cards in Workload Dashboard, Academic Load summary, etc.)
  return (
    <>
      <div
        className={`space-y-1 text-xs ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Email Row */}
        <div className="flex items-center justify-between group/mail">
          <a
            href={contact.mailtoUrl}
            onClick={(e) => e.stopPropagation()}
            title={`Enviar correo a ${contact.email}`}
            className={`inline-flex items-center space-x-1.5 transition-colors truncate max-w-[190px] ${
              isLight
                ? 'text-slate-600 hover:text-blue-700'
                : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <Mail className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="font-mono text-[10px] truncate">{contact.email}</span>
          </a>

          <div className="flex items-center space-x-1 shrink-0 touch-manipulation">
            {allowEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                title={`Editar correo o WhatsApp de ${contact.teacherName}`}
                className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded text-slate-400 hover:text-amber-400 transition-all cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            <a
              href={contact.mailtoUrl}
              onClick={(e) => e.stopPropagation()}
              title={`Abrir cliente de correo para ${contact.email}`}
              className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded text-blue-400 hover:text-blue-300 transition-opacity active:scale-95"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* WhatsApp Row */}
        <div className="flex items-center justify-between group/wa">
          <a
            href={contact.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Chatear por WhatsApp con ${contact.teacherName} (${contact.displayPhone})`}
            className={`inline-flex items-center space-x-1.5 transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-emerald-700'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <WhatsAppIcon className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="font-mono text-[10px] font-medium">{contact.displayPhone}</span>
            {contact.isCustomized && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Contacto editado" />
            )}
          </a>

          <a
            href={contact.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Iniciar chat"
            className="px-2.5 py-1 sm:px-1.5 sm:py-0.2 min-h-[28px] flex items-center rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all shrink-0 active:scale-95 touch-manipulation"
          >
            Chat
          </a>
        </div>
      </div>

      {isEditModalOpen && (
        <EditTeacherContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          teacherName={teacherName}
          onSaved={() => setContactVersion((v) => v + 1)}
        />
      )}
    </>
  );
};

