import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Atelier ATS Engine',
    engine: 'Deterministic Rule-Based (Non-AI)',
    version: '2.0.0'
  });
}
