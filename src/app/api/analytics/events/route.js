import { NextResponse } from 'next/server';
import { ingestClientBatch } from '@/lib/analytics/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const rawEvents = body.events || [];

    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return NextResponse.json({ success: true, received: 0 });
    }

    // Extract headers for geo and device resolution
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ip = forwarded.split(',')[0].trim() || '127.0.0.1';
    
    // Cloudflare / Vercel Geo headers
    const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || '';
    const city = request.headers.get('x-vercel-ip-city') || '';
    const region = request.headers.get('x-vercel-ip-country-region') || '';
    const ua = request.headers.get('user-agent') || '';

    const enrichedEvents = rawEvents.map(evt => {
      const meta = evt.metadata || {};
      let resolvedCountry = country || meta.country;
      let resolvedCity = city || meta.city;

      // Fallback: infer country and city from timezone if hosted locally or headers absent
      if (!resolvedCountry && meta.timezone) {
        const tz = meta.timezone;
        if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Colombo')) {
          resolvedCountry = 'India (IN)';
          if (!resolvedCity) resolvedCity = 'Bengaluru / Bangalore';
        } else if (tz.includes('New_York')) {
          resolvedCountry = 'United States (US)';
          if (!resolvedCity) resolvedCity = 'New York';
        } else if (tz.includes('Los_Angeles')) {
          resolvedCountry = 'United States (US)';
          if (!resolvedCity) resolvedCity = 'Los Angeles';
        } else if (tz.includes('London')) {
          resolvedCountry = 'United Kingdom (GB)';
          if (!resolvedCity) resolvedCity = 'London';
        } else if (tz.includes('Singapore')) {
          resolvedCountry = 'Singapore (SG)';
          if (!resolvedCity) resolvedCity = 'Singapore';
        } else if (tz.includes('Dubai')) {
          resolvedCountry = 'UAE (AE)';
          if (!resolvedCity) resolvedCity = 'Dubai';
        } else if (tz.includes('Europe/')) {
          resolvedCountry = 'Europe (EU)';
        } else if (tz.includes('America/')) {
          resolvedCountry = 'United States (US)';
        }
      }

      return {
        ...evt,
        metadata: {
          ...meta,
          ip: ip.startsWith('127.') || ip === '::1' ? 'Localhost' : ip,
          country: resolvedCountry || 'Unknown',
          city: resolvedCity || 'Unknown',
          region: region || meta.region || '',
          userAgent: meta.userAgent || ua
        }
      };
    });

    await ingestClientBatch(enrichedEvents);

    return NextResponse.json({
      success: true,
      received: enrichedEvents.length
    });
  } catch (err) {
    // Non-blocking: always acknowledge client queue
    return NextResponse.json(
      { success: false, error: 'Ingest error' },
      { status: 200 }
    );
  }
}
