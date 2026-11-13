import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware de encabezados de seguridad y Content Security Policy (CSP) inicial.
 * Configurado para no romper Vite/React, Google Fonts, Web Workers ni enlaces wa.me/mailto:.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';

  const scriptSrc = isProd ? "'self'" : "'self' 'unsafe-inline' 'unsafe-eval'";
  const connectSrc = isProd ? "'self'" : "'self' ws: wss:";

  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "worker-src 'self' blob:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Evitar caché de respuestas de API autenticadas
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}
