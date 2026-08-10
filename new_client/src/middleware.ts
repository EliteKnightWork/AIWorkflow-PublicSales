import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';
import { ALLOW_MAINTENANCE_PATHS } from './constants';

import { auth0 } from './lib/auth0';

export default function middleware(request: NextRequest, _event: NextFetchEvent) {
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const allowedIPs =
    process.env.ADMIN_IPS?.split(',')
      .map((ip) => ip.trim())
      .filter(Boolean) || [];
  const clientIP =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.replace(/::ffff:/, '')
      ?.trim() ||
    request.headers
      .get('x-real-ip')
      ?.replace(/::ffff:/, '')
      ?.trim() ||
    '';

  const { pathname } = request.nextUrl;
  if (isMaintenance && !allowedIPs.includes(clientIP)) {
    const match = /\/(($|api|robots\.txt|_next|.*\.svg|.*\.png|.*\.jpg|.*\.ico).*)/;
    if (!(ALLOW_MAINTENANCE_PATHS.includes(pathname) || match.test(pathname))) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  }

  const match =
    /\/(($|api|thanks|download|maintenance|projects|awardedProjects|robots\.txt|_next|.*\.svg|.*\.png|.*\.jpg|.*\.ico).*)/;
  if (!match.test(pathname)) {
    return auth0.middleware(request);
  }

  return NextResponse.next();
}
