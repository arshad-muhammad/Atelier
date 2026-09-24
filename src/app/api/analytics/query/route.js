import { NextResponse } from 'next/server';
import { verifyAdminSessionToken } from '@/utils/auth';
import {
  getAnalyticsOverview,
  getUserAnalytics,
  getLearningAnalytics,
  getAssessmentAnalytics,
  getLiveAnalytics,
  getPaymentAnalytics,
  getSystemAnalytics,
  getAuditLogs
} from '@/lib/analytics/server';

const ALLOWED_QUERY_TYPES = [
  'overview',
  'users',
  'learning',
  'assessments',
  'live',
  'payments',
  'system',
  'audit'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Security Check: Require Admin Token ──
    const adminToken = request.headers.get('x-admin-token') || searchParams.get('adminToken');
    const authResult = verifyAdminSessionToken(adminToken);
    
    // Fallback security check in dev if admin session token is valid
    if (!authResult || authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin clearance required to access analytics data.' },
        { status: 403 }
      );
    }

    const type = searchParams.get('type') || 'overview';
    if (!ALLOWED_QUERY_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid analytics query type requested.' },
        { status: 400 }
      );
    }

    const range = searchParams.get('range') || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const role = searchParams.get('role') || undefined;
    const courseId = searchParams.get('courseId') || undefined;
    const search = searchParams.get('search') || undefined;
    const forceRefresh = searchParams.get('refresh') === 'true';

    const filterOptions = {
      range,
      startDate,
      endDate,
      role,
      courseId,
      search
    };

    let result;
    switch (type) {
      case 'overview':
        result = await getAnalyticsOverview(filterOptions, forceRefresh);
        break;
      case 'users':
        result = await getUserAnalytics(filterOptions, forceRefresh);
        break;
      case 'learning':
        result = await getLearningAnalytics(filterOptions, forceRefresh);
        break;
      case 'assessments':
        result = await getAssessmentAnalytics(filterOptions, forceRefresh);
        break;
      case 'live':
        result = await getLiveAnalytics(filterOptions, forceRefresh);
        break;
      case 'payments':
        result = await getPaymentAnalytics(filterOptions, forceRefresh);
        break;
      case 'system':
        result = await getSystemAnalytics(filterOptions, forceRefresh);
        break;
      case 'audit':
        result = await getAuditLogs(filterOptions, forceRefresh);
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      ...result
    });
  } catch (err) {
    console.error('Analytics Query API Error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics metrics.' },
      { status: 500 }
    );
  }
}
