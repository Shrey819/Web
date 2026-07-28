import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  
  if (isAdminRoute) {
    if (isLoginPage) {
      if (isLoggedIn) {
        return Response.redirect(new URL('/admin', req.nextUrl));
      }
      return;
    }
    
    if (!isLoggedIn) {
      return Response.redirect(new URL('/admin/login', req.nextUrl));
    }
  }
})

export const config = {
  // Matches all routes except static files and APIs
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
