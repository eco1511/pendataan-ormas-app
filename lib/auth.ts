import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'ormas_session';
const DEV_AUTH_SECRET = 'ormas-local-development-secret-2026-change-me';
export type Role = 'Administrator' | 'Operator' | 'Viewer';
export type SessionUser = { id: string; username: string; name: string; role: Role };

export function getAuthSecretValue() {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) throw new Error('AUTH_SECRET harus minimal 32 karakter.');
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_AUTH_SECRET;
  }

  throw new Error('AUTH_SECRET wajib diatur pada environment production.');
}

function getSecret() {
  return new TextEncoder().encode(getAuthSecretValue());
}

export async function createSession(user: SessionUser) {
  return new SignJWT({ ...user } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(getSecret());
}

export async function readSessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.id || !payload.username || !payload.role) return null;
    return { id: String(payload.id), username: String(payload.username), name: String(payload.name ?? payload.username), role: payload.role as Role };
  } catch { return null; }
}

export async function getSession() {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export function hasRole(user: SessionUser | null, roles: Role[]): user is SessionUser { return Boolean(user && roles.includes(user.role)); }
export async function getRequestSession(req: NextRequest) { return readSessionToken(req.cookies.get(SESSION_COOKIE)?.value); }
