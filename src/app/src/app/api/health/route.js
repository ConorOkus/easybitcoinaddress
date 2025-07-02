import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Health check endpoint called');
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function HEAD() {
  console.log('Health check HEAD endpoint called');
  return new Response(null, { status: 200 });
}