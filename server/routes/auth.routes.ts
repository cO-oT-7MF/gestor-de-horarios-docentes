import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Rate limiter en memoria para mitigar fuerza bruta en login
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 15;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count += 1;
  return true;
}

function safeCompareStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Almacén en memoria para retos y credenciales Passkey (WebAuthn)
interface StoredPasskey {
  credentialId: string;
  role: 'admin' | 'teacher';
  rfc?: string;
  label: string;
  createdAt: string;
}

const activeChallenges = new Map<string, { challenge: string; role: 'admin' | 'teacher'; rfc?: string; exp: number }>();
const passkeyStore = new Map<string, StoredPasskey>();

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    if (!data || !signature || !SESSION_SECRET) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (typeof parsed.exp === 'number' && Date.now() > parsed.exp) {
      return null; // Sesión expirada tras 8 horas
    }
    return parsed;
  } catch {
    return null;
  }
}

function handleAdminLogin(req: Request, res: Response) {
  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos de inicio de sesión. Intente más tarde.' });
  }

  const { password } = req.body || {};

  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  if (typeof password !== 'string' || !safeCompareStrings(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Credenciales administrativas inválidas.' });
  }

  const exp = Date.now() + EIGHT_HOURS_MS;
  const token = signToken({ role: 'admin', exp });

  return res.json({ token, role: 'admin', expiresAt: exp });
}

function handleTeacherLogin(req: Request, res: Response) {
  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos de consulta. Intente más tarde.' });
  }

  const { rfc } = req.body || {};
  const normalizedRfc = String(rfc || '').trim().toUpperCase();

  // Validación estructural estándar de RFC (12 o 13 caracteres)
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(normalizedRfc)) {
    return res.status(400).json({ error: 'Formato de RFC inválido.' });
  }

  if (!SESSION_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  const exp = Date.now() + EIGHT_HOURS_MS;
  const token = signToken({ role: 'teacher', rfc: normalizedRfc, exp });

  return res.json({ token, role: 'teacher', rfc: normalizedRfc, expiresAt: exp });
}

// ============================================================================
// WEBAUTHN PASSKEY LOGIN & REGISTRATION FLOW
// ============================================================================
router.post('/webauthn/register/options', (req: Request, res: Response) => {
  const { role = 'admin', rfc } = req.body || {};
  const normalizedRole = role === 'teacher' ? 'teacher' : 'admin';
  const challenge = crypto.randomBytes(32).toString('base64url');
  const challengeId = crypto.randomUUID();

  activeChallenges.set(challengeId, {
    challenge,
    role: normalizedRole,
    rfc: typeof rfc === 'string' ? rfc.trim().toUpperCase() : undefined,
    exp: Date.now() + CHALLENGE_TTL_MS,
  });

  const userId = Buffer.from(normalizedRole === 'teacher' && rfc ? rfc : 'DIRECCION_ADMIN').toString('base64url');
  return res.json({
    challengeId,
    publicKey: {
      challenge,
      rp: { name: 'Gestor de Horarios Académicos' },
      user: {
        id: userId,
        name: normalizedRole === 'teacher' && rfc ? String(rfc).toUpperCase() : 'admin@plantel.edu.mx',
        displayName: normalizedRole === 'teacher' && rfc ? `Docente ${String(rfc).toUpperCase()}` : 'Dirección Escolar',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 60000,
    },
  });
});

router.post('/webauthn/register/verify', (req: Request, res: Response) => {
  const { challengeId, credentialId, clientDataJSON } = req.body || {};
  const challengeRec = activeChallenges.get(String(challengeId || ''));
  activeChallenges.delete(String(challengeId || ''));

  if (!challengeRec || Date.now() > challengeRec.exp) {
    return res.status(400).json({ error: 'Reto WebAuthn inválido o expirado.' });
  }

  try {
    const clientData = JSON.parse(Buffer.from(String(clientDataJSON || ''), 'base64url').toString('utf8'));
    if (clientData.type !== 'webauthn.create' || clientData.challenge !== challengeRec.challenge) {
      return res.status(400).json({ error: 'Verificación de reto WebAuthn fallida.' });
    }
  } catch {
    return res.status(400).json({ error: 'clientDataJSON malformado.' });
  }

  if (typeof credentialId !== 'string' || !credentialId) {
    return res.status(400).json({ error: 'credentialId requerido.' });
  }

  passkeyStore.set(credentialId, {
    credentialId,
    role: challengeRec.role,
    rfc: challengeRec.rfc,
    label: challengeRec.role === 'admin' ? 'Passkey Dirección' : `Passkey ${challengeRec.rfc}`,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, credentialId });
});

router.post('/webauthn/login/options', (_req: Request, res: Response) => {
  const challenge = crypto.randomBytes(32).toString('base64url');
  const challengeId = crypto.randomUUID();
  activeChallenges.set(challengeId, {
    challenge,
    role: 'admin',
    exp: Date.now() + CHALLENGE_TTL_MS,
  });

  const allowCredentials = Array.from(passkeyStore.values()).map((pk) => ({
    type: 'public-key',
    id: pk.credentialId,
  }));

  return res.json({
    challengeId,
    publicKey: {
      challenge,
      allowCredentials,
      userVerification: 'preferred',
      timeout: 60000,
    },
  });
});

router.post('/webauthn/login/verify', (req: Request, res: Response) => {
  if (!SESSION_SECRET) {
    return res.status(500).json({ error: 'Configuración de seguridad del servidor incompleta.' });
  }

  const { challengeId, credentialId, clientDataJSON } = req.body || {};
  const challengeRec = activeChallenges.get(String(challengeId || ''));
  activeChallenges.delete(String(challengeId || ''));

  if (!challengeRec || Date.now() > challengeRec.exp) {
    return res.status(400).json({ error: 'Reto WebAuthn inválido o expirado.' });
  }

  try {
    const clientData = JSON.parse(Buffer.from(String(clientDataJSON || ''), 'base64url').toString('utf8'));
    if (clientData.type !== 'webauthn.get' || clientData.challenge !== challengeRec.challenge) {
      return res.status(401).json({ error: 'Autenticación Passkey rechazada.' });
    }
  } catch {
    return res.status(400).json({ error: 'clientDataJSON malformado.' });
  }

  const passkey = passkeyStore.get(String(credentialId || ''));
  if (!passkey) {
    return res.status(401).json({ error: 'Passkey no registrada en este servidor.' });
  }

  const exp = Date.now() + EIGHT_HOURS_MS;
  const payload =
    passkey.role === 'teacher'
      ? { role: 'teacher', rfc: passkey.rfc, exp }
      : { role: 'admin', exp };
  const token = signToken(payload);

  return res.json({ token, ...payload, expiresAt: exp });
});

// Rutas principales
router.post('/login/admin', handleAdminLogin);
router.post('/login/teacher', handleTeacherLogin);

// Alias compatibles con versiones previas del cliente
router.post('/admin/login', handleAdminLogin);
router.post('/teacher/login', handleTeacherLogin);

export default router;
