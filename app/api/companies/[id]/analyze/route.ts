import { NextRequest, NextResponse } from 'next/server';
import type { Score } from '@/lib/store';
import { getCompany, resolveUserId, saveScore as prismaSaveScore, saveSignal as prismaSaveSignal } from '@/lib/db';
import { score, getSignals as storeGetSignals, getScore as storeGetScore, db } from '@/lib/store';
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

  // Register in in-memory store so score() can find it
  const existingIdx = db.companies.findIndex(c => c.id === company.id);
  if (existingIdx === -1) {
    db.companies.push(inMemoryCompany);
  }

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

  // Persist score and signals to SQLite so subsequent page loads see them
  if (riskScore) {
    await prismaSaveScore(
      company.id,
      riskScore.score,
      riskScore.breakdown,
      riskScore.explanation,
      riskScore.predictions,
      riskScore.opportunities,
    ).catch(() => {});
  }

  const newSignals = storeGetSignals(company.id).slice(beforeCount);
  for (const sig of newSignals) {
    await prismaSaveSignal(
      company.id,
      sig.signalType,
      sig.title,
      sig.rawPayload,
      sig.sourceUrl,
      sig.sentimentScore,
      sig.tags,
      sig.description,
    ).catch(() => {});
  }

  return NextResponse.json({
    company: inMemoryCompany,
    results,
    riskScore,
    signalsStored: storedCount,
    newSignals: newCount,
  });
}
