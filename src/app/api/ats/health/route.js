import { NextResponse } from 'next/server';

const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL || 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const targetUrl = `${ATS_SERVICE_URL.replace(/\/$/, '')}/api/v1/health`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'down', error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        status: 'offline',
        message: 'ATS FastAPI microservice is offline or initializing.',
      },
      { status: 503 }
    );
  }
}
