import { NextRequest, NextResponse } from 'next/server';
import type { Score } from '@/lib/store';
import { getCompany, resolveUserId } from '@/lib/db';
import { score, getSignals as storeGetSignals, getScore as storeGetScore } from '@/lib/store';
import { collectAll } from '@/lib/collectors';
import { runAgent } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = resolveUserId(req);

  const company = await getCompany(params.id);
  if (!company) {
    return NextResponse.json({ detail: 'not found' }, { status: 404 });
  }
  if (company.userId !== userId) {
    return NextResponse.json({ detail: 'not found' }, { status: 404 });
  }

  const inMemoryCompany = {
    id: company.id,
    name: company.name,
    industry: company.industry ?? 'Technology',
    website: company.website,
    foundedYear: company.foundedYear,
    greenhouseToken: company.greenhouseToken,
    leverSlug: company.leverSlug,
    createdAt: company.createdAt.toISOString(),
  };

  const beforeCount = storeGetSignals(company.id).length;

  // Try the AI agent first — it collects data AND produces the score
  const priorScore = storeGetScore(company.id);
  const agentScore = await runAgent(inMemoryCompany, priorScore);
  let riskScore: Score | undefined;
  let results: { source: string; status: string; detail: string; count: number }[] = [];

  if (agentScore) {
    riskScore = agentScore;
    results = [];
  } else {
    // Fallback: deterministic parallel collectors + rule-based scoring
    results = await collectAll(inMemoryCompany);
    riskScore = await score(company.id);
  }

  const storedCount = storeGetSignals(company.id).length;
  const newCount = storedCount - beforeCount;

  return NextResponse.json({
    company: inMemoryCompany,
    results,
    riskScore,
    signalsStored: storedCount,
    newSignals: newCount,
  });
}
