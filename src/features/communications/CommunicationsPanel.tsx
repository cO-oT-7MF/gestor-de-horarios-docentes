import React, { useState, useMemo } from 'react';
import { Mail, MessageCircle, Search, Send } from 'lucide-react';
import { TEACHER_CATALOG } from '../../data/teacherCatalog';
import { AnchorTooltip } from '../../components/AnchorTooltip';

interface CommunicationsPanelProps {
  onOpenMassNotification?: () => void;
  isAdmin: boolean;
}

export const CommunicationsPanel: React.FC<CommunicationsPanelProps> = ({
  onOpenMassNotification,
  isAdmin,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEACHER_CATALOG.filter(
      (t) =>
        t.status !== 'inactive' &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          (t.payrollId || '').toLowerCase().includes(q) ||
          (t.mainSubject || '').toLowerCase().includes(q))
    );
  }, [search]);

  const allEmails = useMemo(
    () =>
      filtered
        .map((t) => t.email)
        .filter((e): e is string => Boolean(e && e.includes('@'))),
    [filtered]
  );

  const asuntoGeneral = 'Aviso Institucional — Horarios y Carga Académica';
  const bccHref = `mailto:?bcc=${encodeURIComponent(allEmails.join(','))}&subject=${encodeURIComponent(
    asuntoGeneral
  )}`;

  const formatWaLink = (phone?: string, name?: string) => {
    const whatsappInternational = (phone || '').replace(/\D/g, '');
    if (!whatsappInternational) return null;
    const mensajeInstitucional = `Estimado(a) Prof. ${name || ''}, le compartimos una actualización de su horario escolar.`;
    return `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(mensajeInstitucional)}`;
  };

  const formatMailtoLink = (email: string, name?: string) => {
    const asunto = `Horario y Carga Académica — ${name || 'Docente'}`;
    const cuerpo = `Estimado(a) Prof. ${name || ''},\n\nLe compartimos información actualizada sobre su horario escolar y guardias asignadas.\n\nAtentamente,\nDirección Escolar`;
    return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[var(--brand-surface-elevated,#111318)] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-sm sm:text-base">
            Directorio Docente y Enlaces Directos
          </h3>
          <p className="text-xs text-slate-400">
            Contacto inmediato por correo (mailto:), WhatsApp (wa.me) y envíos masivos BCC
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <a
              href={bccHref}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25"
            >
              <Mail className="w-3.5 h-3.5" />
              BCC Rápido ({allEmails.length})
            </a>
            {onOpenMassNotification && (
              <button
                type="button"
                onClick={onOpenMassNotification}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] hover:opacity-90"
              >
                <Send className="w-3.5 h-3.5" />
                Envío Masivo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar docente por nombre, RFC o asignatura..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((t) => {
          const wa = formatWaLink(t.whatsapp || t.phone, t.name);
          return (
            <div
              key={t.id}
              className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{t.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {t.payrollId || t.id} • {t.mainSubject || 'Docente'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.email && (
                  <AnchorTooltip label={`Enviar correo a ${t.name}`}>
                    <a
                      href={formatMailtoLink(t.email, t.name)}
                      aria-label={`Enviar correo a ${t.name}`}
                      className="p-2 rounded-lg bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </AnchorTooltip>
                )}
                {wa && (
                  <AnchorTooltip label={`WhatsApp a ${t.name}`}>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp a ${t.name}`}
                      className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </AnchorTooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
