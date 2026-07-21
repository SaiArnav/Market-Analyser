import { NextResponse } from 'next/server'; import { db, getScoreHistory } from '@/lib/store'; export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const company = db.companies.find(c => c.id === params.id);
  if (!company) return NextResponse.json({ detail: 'not found' }, { status: 404 });
  const current = db.scores.find(s => s.companyId === params.id) || null;
  const history = getScoreHistory(params.id);
  return NextResponse.json({ companyId: params.id, current, history });
}
