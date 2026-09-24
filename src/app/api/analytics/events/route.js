import { NextResponse } from 'next/server';
import { ingestClientBatch } from '@/lib/analytics/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const events = body.events || [];

    if (Array.isArray(events) && events.length > 0) {
      // Ingest events into server buffer and forward to Tinybird
      await ingestClientBatch(events);
    }

    return NextResponse.json({
      success: true,
      received: events.length
    });
  } catch (err) {
    // Non-blocking: always acknowledge client queue
    return NextResponse.json(
      { success: false, error: 'Ingest error' },
      { status: 200 }
    );
  }
}
