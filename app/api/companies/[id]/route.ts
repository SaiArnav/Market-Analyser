import { NextRequest, NextResponse } from 'next/server';
import {
  getCompany,
  deleteCompany as dbDeleteCompany,
  getSignals as dbGetSignals,
  getTimeline as dbGetTimeline,
  getScore,
  getScoreHistory as dbGetScoreHistory,
  getLatestReport,
  resolveUserId,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = resolveUserId(req);

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ detail: 'not found' }, { status: 404 });
  }
  if (company.userId !== userId) {
    return NextResponse.json({ detail: 'not found' }, { status: 404 });
  }

  const [signals, timeline, riskScore, scoreHistory, report] = await Promise.all([
    dbGetSignals(params.id),
    dbGetTimeline(params.id),
    getScore(params.id),
    dbGetScoreHistory(params.id),
    getLatestReport(params.id),
  ]);

  return NextResponse.json({
    id: company.id,
    name: company.name,
    industry: company.industry,
    website: company.website,
    foundedYear: company.foundedYear,
    signals,
    riskScore,
    scoreHistory,
    timeline,
    report,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = resolveUserId(req);

  const company = await getCompany(params.id);
  if (!company || company.userId !== userId) {
    return NextResponse.json({ detail: 'not found' }, { status: 404 });
  }

  const ok = await dbDeleteCompany(params.id);
  return NextResponse.json({ deleted: ok }, { status: ok ? 200 : 404 });
}
