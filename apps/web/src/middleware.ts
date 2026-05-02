import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ✅ Protected routes that require authentication
  const protectedRoutes = ['/orders', '/profile', '/lottery-code', '/checkout', '/swago-pass', '/ticket', '/wishlist'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // ✅ Legacy redirect for /kids routes
  if (pathname.startsWith('/kids')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // ✅ Check authentication for protected routes
  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie || !sessionCookie.value) {
      // User not logged in - redirect to login
      const loginUrl = new URL('/login', request.url);
      // Save where they wanted to go so we can redirect back after login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Add pathname to headers so layout can access it
  requestHeaders.set("x-pathname", pathname);

  // ✅ Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // ✅ FIXED: Disable caching for protected routes in production
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  }

  return response;
}

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
