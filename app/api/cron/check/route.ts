import { NextResponse } from 'next/server';
import { db, score, getSignals } from '@/lib/store';
import { collectAll } from '@/lib/collectors';
import { runAgent } from '@/lib/ai';
import { maybeNotify } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
  }

  const companies = [...db.companies];
  const details: {
    companyId: string;
    name: string;
    signalsAdded: number;
    score: number;
    notified: { slack: boolean; email: boolean };
  }[] = [];

  for (const company of companies) {
    try {
      const beforeCount = getSignals(company.id).length;

      const agentScore = await runAgent(company);
      let riskScore;
      if (agentScore) {
        riskScore = agentScore;
      } else {
        await collectAll(company);
        riskScore = await score(company.id);
      }

      const afterCount = getSignals(company.id).length;
      const signalsAdded = afterCount - beforeCount;

      const notified = await maybeNotify(
        company.id,
        company.name,
        riskScore.score,
        signalsAdded,
        riskScore.explanation,
      );

      details.push({
        companyId: company.id,
        name: company.name,
        signalsAdded,
        score: riskScore.score,
        notified,
      });
    } catch (e) {
      details.push({
        companyId: company.id,
        name: company.name,
        signalsAdded: -1,
        score: -1,
        notified: { slack: false, email: false },
      });
    }
  }

  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    companiesProcessed: details.length,
    details,
  });
}
