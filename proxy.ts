import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'ormas_session';
const DEV_SECRET = 'ormas-local-development-secret-2026-change-me';

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET?.trim() || DEV_SECRET;
  return new TextEncoder().encode(s);
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/dashboard')) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = { matcher: ['/dashboard/:path*'] };