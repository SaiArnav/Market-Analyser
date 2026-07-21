import { NextRequest, NextResponse } from 'next/server';
import { listCompanies, addCompany as dbAddCompany, getScore, getSignals as dbGetSignals, getTimeline, resolveUserId } from '@/lib/db';
import { getSignals as storeGetSignals, getTimeline as storeGetTimeline } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = resolveUserId(req);

  const companies = await listCompanies(userId);
  const results = await Promise.all(
    companies.map(async (c: any) => {
      const score = await getScore(c.id);
      const signals = await dbGetSignals(c.id);
      const timeline = await getTimeline(c.id);
      return {
        id: c.id,
        name: c.name,
        industry: c.industry,
        website: c.website,
        foundedYear: c.foundedYear,
        createdAt: c.createdAt,
        greenhouseToken: c.greenhouseToken,
        leverSlug: c.leverSlug,
        score: score ?? null,
        signalCount: signals.length,
        timelineEvents: timeline.length,
      };
    }),
  );
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const userId = resolveUserId(req);
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ detail: 'name is required' }, { status: 422 });
  }
  const company = await dbAddCompany(
    {
      name: body.name.trim(),
      greenhouseToken: body.greenhouseToken || undefined,
      leverSlug: body.leverSlug || undefined,
      industry: body.industry || 'Technology',
      website: body.website || undefined,
      foundedYear: body.foundedYear ? parseInt(String(body.foundedYear), 10) || undefined : undefined,
    },
    userId,
  );
  return NextResponse.json(company, { status: 201 });
}
