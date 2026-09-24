import { NextResponse } from 'next/server';

const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL || 'http://127.0.0.1:8000';
const ATS_API_KEY = process.env.ATS_API_KEY || 'atelier-ats-production-key-2026';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(req) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume');
    const jobDescription = formData.get('job_description') || '';

    if (!resumeFile || typeof resumeFile === 'string') {
      return NextResponse.json(
        { error: 'A resume file (PDF or DOCX) is required.' },
        { status: 400 }
      );
    }

    // Prepare outbound multipart/form-data for Python FastAPI service
    const outboundFormData = new FormData();
    outboundFormData.append('resume', resumeFile, resumeFile.name);
    if (jobDescription && typeof jobDescription === 'string') {
      outboundFormData.append('job_description', jobDescription);
    }

    // Call dedicated FastAPI ATS microservice
    const targetUrl = `${ATS_SERVICE_URL.replace(/\/$/, '')}/api/v1/analyze`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'x-api-key': ATS_API_KEY,
      },
      body: outboundFormData,
      // Pass signal for timeout if needed
    });

    if (!response.ok) {
      let errDetail = 'ATS service analysis failed.';
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {
        errDetail = await response.text();
      }
      return NextResponse.json(
        { error: errDetail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error connecting to ATS microservice:', err);
    return NextResponse.json(
      {
        error: 'Unable to connect to Atelier ATS engine. Please verify the Python ATS service is running on port 8000.',
        details: err.message
      },
      { status: 503 }
    );
  }
}
