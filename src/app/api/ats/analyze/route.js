import { NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/ats';

export const dynamic = 'force-dynamic';

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

    const fileName = resumeFile.name || 'resume.pdf';
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size of 10MB.' },
        { status: 413 }
      );
    }

    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await analyzeResume(
      buffer,
      fileName,
      resumeFile.type || '',
      typeof jobDescription === 'string' ? jobDescription : ''
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error analyzing resume:', err);
    return NextResponse.json(
      {
        error: 'Failed to analyze resume.',
        details: err.message
      },
      { status: 500 }
    );
  }
}
