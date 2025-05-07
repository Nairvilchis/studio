import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('Authorization');

  if (basicAuth) {
    const auth = basicAuth.split(' ')[1];
    const [user, pass] = Buffer.from(auth, 'base64').toString().split(':');

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      return NextResponse.next();
    }
  }

  // Ask for credentials if not provided or incorrect
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: '/admin/:path*', // Apply middleware to all routes under /admin
};