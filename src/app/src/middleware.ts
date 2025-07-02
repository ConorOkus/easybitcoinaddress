import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle Railway health checks
  if (request.nextUrl.pathname === '/') {
    const isHealthCheck = request.headers.get('user-agent')?.toLowerCase().includes('healthcheck') ||
                         request.headers.get('x-forwarded-for') === '10.0.0.0/8';
    
    if (isHealthCheck) {
      console.log('Railway health check detected');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/'
};