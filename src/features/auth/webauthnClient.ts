function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64Url.length + 3) % 4);
  const raw = atob(padded);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

export async function registerPasskey(role: 'admin' | 'teacher', rfc?: string): Promise<{ ok: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: 'WebAuthn / Passkeys no está soportado en este navegador.' };
  }

  try {
    const optRes = await fetch('/api/auth/webauthn/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, rfc }),
    });
    const optData = await optRes.json();
    if (!optRes.ok) return { ok: false, error: optData.error || 'Error obteniendo opciones WebAuthn.' };

    const pk = optData.publicKey;
    const credential = (await navigator.credentials.create({
      publicKey: {
        ...pk,
        challenge: base64UrlToUint8Array(pk.challenge),
        user: {
          ...pk.user,
          id: base64UrlToUint8Array(pk.user.id),
        },
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, error: 'Registro de Passkey cancelado.' };

    const response = credential.response as AuthenticatorAttestationResponse;
    const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: optData.challengeId,
        credentialId: credential.id,
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) return { ok: false, error: verifyData.error || 'Error verificando Passkey.' };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error durante registro WebAuthn.' };
  }
}

export async function loginWithPasskey(): Promise<{
  ok: boolean;
  token?: string;
  role?: 'admin' | 'teacher';
  rfc?: string;
  expiresAt?: number;
  error?: string;
}> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: 'WebAuthn / Passkeys no está soportado en este navegador.' };
  }

  try {
    const optRes = await fetch('/api/auth/webauthn/login/options', { method: 'POST' });
    const optData = await optRes.json();
    if (!optRes.ok) return { ok: false, error: optData.error || 'Error iniciando login Passkey.' };

    const pk = optData.publicKey;
    const credential = (await navigator.credentials.get({
      publicKey: {
        ...pk,
        challenge: base64UrlToUint8Array(pk.challenge),
        allowCredentials: (pk.allowCredentials || []).map((c: { type: PublicKeyCredentialType; id: string }) => ({
          type: c.type,
          id: base64UrlToUint8Array(c.id),
        })),
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, error: 'Autenticación Passkey cancelada.' };

    const response = credential.response as AuthenticatorAssertionResponse;
    const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: optData.challengeId,
        credentialId: credential.id,
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) return { ok: false, error: verifyData.error || 'Passkey no reconocida.' };
    return { ok: true, ...verifyData };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error en autenticación Passkey.' };
  }
}
