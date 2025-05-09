import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Only protect routes under /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    // Check if Basic Auth header exists
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      // Decode base64 credentials
      const [user, pwd] = atob(authValue).split(':');

      // Check credentials against environment variables
      if (user === adminUser && pwd === adminPass) {
        // Authorized: proceed to the requested page
        return NextResponse.next();
      }
    }

    // Unauthorized: Prompt for credentials
    const url = req.nextUrl;
    url.pathname = '/api/auth-required'; // Use a simple API route to return 401
    // Alternatively, redirect to a login page:
    // url.pathname = '/login';
    // return NextResponse.redirect(url);

    const response = NextResponse.rewrite(url);
    response.headers.set(
      'WWW-Authenticate',
      'Basic realm="Acceso restringido al área de administración"'
    );
    return response;
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Define the matcher for the middleware
export const config = {
  matcher: '/admin/:path*',
};
