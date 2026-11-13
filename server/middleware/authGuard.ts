import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../routes/auth.routes.ts';

export type UserRole = 'admin' | 'teacher';

export interface SessionPayload {
  role: UserRole;
  sub?: string;
  teacherName?: string;
  rfc?: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  session?: SessionPayload;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Sesión no iniciada. Token requerido.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'teacher')) {
    res.status(401).json({ error: 'Token inválido o expirado (TTL máximo 8 horas).' });
    return;
  }

  req.session = {
    role: payload.role,
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    teacherName: typeof payload.teacherName === 'string' ? payload.teacherName : undefined,
    rfc: typeof payload.rfc === 'string' ? payload.rfc : undefined,
    exp: typeof payload.exp === 'number' ? payload.exp : 0,
  };
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.session?.role !== 'admin') {
      res.status(403).json({
        error: 'Acceso denegado: esta operación requiere rol Administrativo.',
      });
      return;
    }
    next();
  });
}
