import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Exclude the login page itself
    if (pathname === '/admin/login') {
      const adminCookie = request.cookies.get('admin_session')?.value;
      const isAdmin = await verifySessionToken(adminCookie);
      if (isAdmin && isAdmin.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    const adminCookie = request.cookies.get('admin_session')?.value;
    const isAdmin = await verifySessionToken(adminCookie);
    if (!isAdmin || isAdmin.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Voter Ballot Flow Route
  if (pathname === '/vote/ballot') {
    const voterCookie = request.cookies.get('voter_session')?.value;
    const isVoter = await verifySessionToken(voterCookie);
    if (!isVoter) {
      const voteUrl = new URL('/vote', request.url);
      return NextResponse.redirect(voteUrl);
    }
  }

  // 3. Redirect active voter sessions from /vote access-code page to the ballot page
  if (pathname === '/vote') {
    const voterCookie = request.cookies.get('voter_session')?.value;
    const isVoter = await verifySessionToken(voterCookie);
    if (isVoter) {
      return NextResponse.redirect(new URL('/vote/ballot', request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware matcher
export const config = {
  matcher: [
    '/admin/:path*',
    '/vote',
    '/vote/ballot',
  ],
};
