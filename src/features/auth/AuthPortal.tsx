import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, KeyRound, Building2, Fingerprint } from 'lucide-react';
import type { PlantelPreset } from '../../core/models/institution.types';
import { isWebAuthnSupported } from './webauthnClient';

interface AuthPortalProps {
  institution: PlantelPreset;
  onLoginAdmin: (password: string) => Promise<boolean>;
  onLoginTeacher: (rfc: string) => Promise<boolean>;
  onLoginPasskey?: () => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  institution,
  onLoginAdmin,
  onLoginTeacher,
  onLoginPasskey,
  error,
  isLoading,
}) => {
  const [mode, setMode] = useState<'admin' | 'teacher'>('admin');
  const [password, setPassword] = useState('');
  const [rfc, setRfc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'admin') {
      await onLoginAdmin(password);
    } else {
      await onLoginTeacher(rfc);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--brand-surface,#0a0a0a)] text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[var(--brand-surface-elevated,#111318)] shadow-2xl overflow-hidden">
        <div
          className="p-6 border-b border-slate-800"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary, #d97706) 22%, transparent), transparent)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {institution.cct} • Ciclo {institution.schoolYear}
              </p>
              <h1 className="text-lg font-bold text-white leading-tight">{institution.name}</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Portal Dual de Acceso Protegido (Sesión firmada con expiración de 8 horas)
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                mode === 'admin'
                  ? 'bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administrativo
            </button>
            <button
              type="button"
              onClick={() => setMode('teacher')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                mode === 'teacher'
                  ? 'bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Docente (RFC)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'admin' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña Administrativa (ADMIN_PASSWORD)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese contraseña de Dirección"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-[var(--brand-primary,#d97706)]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  RFC o Identificador Institucional
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    placeholder="Ej. RFC-ADRI-7804 o DOC-ADRIANA"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white uppercase focus:outline-none focus:border-[var(--brand-primary,#d97706)]"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Vista acotada exclusivamente a su horario individual, grupos y avance frente a contrato.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-[var(--brand-primary,#d97706)] text-[var(--brand-primary-foreground,#fff)] hover:opacity-95 disabled:opacity-50 transition-opacity"
            >
              {isLoading
                ? 'Validando credenciales...'
                : mode === 'admin'
                ? 'Ingresar como Administrador'
                : 'Consultar Mi Horario'}
            </button>

            {onLoginPasskey && isWebAuthnSupported() && (
              <button
                type="button"
                disabled={isLoading}
                onClick={onLoginPasskey}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-slate-700 bg-slate-900/90 text-slate-200 hover:border-[var(--brand-primary,#d97706)] flex items-center justify-center gap-2 transition-colors"
              >
                <Fingerprint className="w-4 h-4 text-[var(--brand-primary,#d97706)]" />
                Ingresar con Passkey (WebAuthn)
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
