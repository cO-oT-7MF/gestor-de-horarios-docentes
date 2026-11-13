import { useState, useEffect, useCallback } from 'react';
import { TEACHER_CATALOG } from '../../data/teacherCatalog';
import { loginWithPasskey } from './webauthnClient';

export type AuthRole = 'admin' | 'teacher';

export interface AuthSession {
  token: string;
  role: AuthRole;
  sub: string;
  teacherName?: string;
  rfc?: string;
  expiresAt: string;
}

const STORAGE_KEY = 'gestor_auth_session_v1';

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setError(null);
  }, []);

  // Verificar expiración estricta de 8 horas periódicamente
  useEffect(() => {
    if (!session) return;
    const msLeft = new Date(session.expiresAt).getTime() - Date.now();
    if (msLeft <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(logout, msLeft);
    return () => clearTimeout(timer);
  }, [session, logout]);

  const loginAdmin = useCallback(async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Contraseña administrativa incorrecta.');
        return false;
      }
      const expiresIso =
        typeof data.expiresAt === 'number'
          ? new Date(data.expiresAt).toISOString()
          : String(data.expiresAt);
      const next: AuthSession = {
        token: data.token,
        role: 'admin',
        sub: data.session?.sub || 'ADMIN',
        expiresAt: expiresIso,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      return true;
    } catch {
      setError('No se pudo conectar con el servidor Express para validar ADMIN_PASSWORD.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginTeacherByRfc = useCallback(async (rfcInput: string) => {
    setIsLoading(true);
    setError(null);
    const query = rfcInput.trim().toUpperCase();
    if (!query) {
      setError('Ingrese su RFC o identificador institucional.');
      setIsLoading(false);
      return false;
    }

    try {
      const res = await fetch('/api/auth/login/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: query }),
      });
      if (res.ok) {
        const data = await res.json();
        const rfcVal = String(data.rfc || data.session?.rfc || query);
        const localTeacher = TEACHER_CATALOG.find(
          (t) => t.payrollId?.toUpperCase() === rfcVal || t.id.toUpperCase() === rfcVal
        );
        const expiresIso =
          typeof data.expiresAt === 'number'
            ? new Date(data.expiresAt).toISOString()
            : String(data.expiresAt);
        const next: AuthSession = {
          token: data.token,
          role: 'teacher',
          sub: localTeacher?.id || rfcVal,
          teacherName: localTeacher?.name || data.session?.teacherName || rfcVal,
          rfc: rfcVal,
          expiresAt: expiresIso,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      setError(errData.error || 'RFC inválido o no encontrado.');
      return false;
    } catch {
      // Modo offline / PWA / Tauri standalone: validar contra catálogo local en IndexedDB/memoria
      const localMatch = TEACHER_CATALOG.find(
        (t) =>
          t.payrollId?.toUpperCase() === query ||
          t.id.toUpperCase() === query ||
          t.name.toUpperCase() === query
      );
      if (!localMatch) {
        setError(`Modo offline: no se encontró docente con RFC "${query}".`);
        return false;
      }
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const next: AuthSession = {
        token: 'offline-local-session',
        role: 'teacher',
        sub: localMatch.id,
        teacherName: localMatch.name,
        rfc: localMatch.payrollId || localMatch.id,
        expiresAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginPasskey = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await loginWithPasskey();
    setIsLoading(false);
    if (!result.ok || !result.token) {
      setError(result.error || 'No se pudo autenticar con Passkey.');
      return false;
    }
    const rfcVal = result.rfc;
    const localTeacher = rfcVal
      ? TEACHER_CATALOG.find(
          (t) => t.payrollId?.toUpperCase() === rfcVal || t.id.toUpperCase() === rfcVal
        )
      : undefined;

    const next: AuthSession = {
      token: result.token,
      role: result.role || 'admin',
      sub: localTeacher?.id || rfcVal || 'ADMIN',
      teacherName: localTeacher?.name || rfcVal,
      rfc: rfcVal,
      expiresAt: new Date(result.expiresAt || Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return true;
  }, []);

  return {
    session,
    error,
    isLoading,
    loginAdmin,
    loginTeacherByRfc,
    loginPasskey,
    logout,
  };
}
