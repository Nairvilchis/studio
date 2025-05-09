import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Acceso restringido al área de administración"',
    },
  });
}

export async function POST() {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Acceso restringido al área de administración"',
      },
    });
  }

export async function PUT() {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Acceso restringido al área de administración"',
      },
    });
  }

export async function DELETE() {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Acceso restringido al área de administración"',
      },
    });
  }