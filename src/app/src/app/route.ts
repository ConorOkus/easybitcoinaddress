import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'easybitcoinaddress',
    timestamp: new Date().toISOString()
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}