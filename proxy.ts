import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  
  if (isAdminRoute) {
    if (isLoginPage) {
      if (isLoggedIn && userRole === 'ADMIN') {
        return Response.redirect(new URL('/admin', req.nextUrl));
      }
      return;
    }
    
    if (!isLoggedIn) {
      return Response.redirect(new URL('/admin/login', req.nextUrl));
    }

    if (userRole !== 'ADMIN') {
      return Response.redirect(new URL('/admin/login?error=AccessDenied', req.nextUrl));
    }
  }

  // Defense-in-depth: Fast network edge check for customer account routes
  const pathname = req.nextUrl.pathname;
  const isCustomerRoute =
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/');

  if (isCustomerRoute) {
    const hasStorefrontSession = req.cookies.has('om_session');
    const hasAuthJsSession =
      req.cookies.has('authjs.session-token') ||
      req.cookies.has('__Secure-authjs.session-token');
    const hasAnySession = isLoggedIn || hasStorefrontSession || hasAuthJsSession;

    if (!hasAnySession) {
      const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search);
      return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl));
    }
  }
})


export const config = {
  // Matches all routes except static files and APIs
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
