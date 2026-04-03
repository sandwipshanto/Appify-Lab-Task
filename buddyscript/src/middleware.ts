import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const protectedRoutes = ['/feed'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection: validate Origin header on state-changing requests to API routes
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    try {
      if (!origin || new URL(origin).host !== host) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const token = request.cookies.get('token')?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
      isAuthenticated = true;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAuthenticated ? '/feed' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/feed/:path*', '/login', '/register', '/api/:path*'],
};
