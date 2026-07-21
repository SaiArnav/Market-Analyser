import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
    const adapter = new PrismaLibSql({ url });
    return new PrismaClient({ adapter } as any);
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const SALT_ROUNDS = 12;

export const DEMO_USER_ID = '__demo__';

export function resolveUserId(req: NextRequest): string {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.split('; ').find(c => c.startsWith('userId='));
  return match?.split('=')[1] || DEMO_USER_ID;
}

// ── USER AUTH ────────────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  password: string,
): Promise<{ id: string; email: string; createdAt: Date } | null> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return null;
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, password: hashed } });
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function getUserByEmail(
  email: string,
): Promise<{ id: string; email: string; password: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  return { id: user.id, email: user.email, password: user.password };
}

export async function getUserById(
  id: string,
): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return { id: user.id, email: user.email };
}

// ── COMPANIES ────────────────────────────────────────────────────────────────

export async function listCompanies(userId: string): Promise<any[]> {
  return prisma.company.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompany(id: string): Promise<any | null> {
  return prisma.company.findUnique({ where: { id } });
}

export async function addCompany(
  input: {
    name: string;
    industry?: string;
    website?: string;
    foundedYear?: number;
    greenhouseToken?: string;
    leverSlug?: string;
  },
  userId: string,
): Promise<any> {
  return prisma.company.create({
    data: { ...input, userId },
  });
}

export async function deleteCompany(companyId: string): Promise<boolean> {
  try {
    await prisma.company.delete({ where: { id: companyId } });
    return true;
  } catch {
    return false;
  }
}

// ── SIGNALS ──────────────────────────────────────────────────────────────────

export async function saveSignal(
  companyId: string,
  signalType: string,
  title: string,
  rawPayload: any,
  sourceUrl?: string,
  sentimentScore?: number,
  tags?: string[],
  description?: string,
): Promise<any> {
  const signal = await prisma.signal.create({
    data: {
      companyId,
      signalType,
      title,
      description: description ?? null,
      sourceUrl: sourceUrl ?? null,
      sentimentScore: sentimentScore ?? null,
      tags: JSON.stringify(tags ?? []),
      rawPayload: JSON.stringify(rawPayload ?? {}),
    },
  });

  const impactWeight = Math.abs(sentimentScore ?? 0.5) * 10;
  await prisma.timelineEvent.create({
    data: {
      companyId,
      signalId: signal.id,
      title,
      description: description ?? title,
      signalType,
      impactWeight,
      tags: JSON.stringify(tags ?? []),
    },
  });

  return signal;
}

export async function getSignals(
  companyId: string,
  signalType?: string,
): Promise<any[]> {
  const where: any = { companyId };
  if (signalType) where.signalType = signalType;

  const signals = await prisma.signal.findMany({
    where,
    orderBy: { detectedAt: 'desc' },
  });

  return signals.map((s) => ({
    ...s,
    tags: JSON.parse(s.tags),
    rawPayload: JSON.parse(s.rawPayload),
  }));
}

// ── SCORES ───────────────────────────────────────────────────────────────────

export async function saveScore(
  companyId: string,
  score: number,
  breakdown: any,
  explanation: string,
  predictions: any[],
  opportunities: any[],
): Promise<any> {
  const existing = await prisma.score.findFirst({ where: { companyId } });

  if (existing) {
    await prisma.scoreSnapshot.create({
      data: {
        companyId,
        score: existing.score,
        hiringDecline: existing.hiringDecline,
        negativeSentiment: existing.negativeSentiment,
        patentStagnation: existing.patentStagnation,
        negativeNews: existing.negativeNews,
        productStagnation: existing.productStagnation,
        leadershipInstability: existing.leadershipInstability,
        fundingHealth: existing.fundingHealth,
        partnershipScore: existing.partnershipScore,
      },
    });

    await prisma.score.delete({ where: { id: existing.id } });
  }

  return prisma.score.create({
    data: {
      companyId,
      score,
      explanation,
      hiringDecline: breakdown.hiring_decline_score ?? 0,
      negativeSentiment: breakdown.negative_sentiment_score ?? 0,
      patentStagnation: breakdown.patent_stagnation_score ?? 0,
      negativeNews: breakdown.negative_news_score ?? 0,
      productStagnation: breakdown.product_stagnation_score ?? 0,
      leadershipInstability: breakdown.leadership_instability_score ?? 0,
      fundingHealth: breakdown.funding_health_score ?? 0,
      partnershipScore: breakdown.partnership_score ?? 0,
      predictions: JSON.stringify(predictions),
      opportunities: JSON.stringify(opportunities),
    },
  });
}

export async function getScore(companyId: string): Promise<any | null> {
  const s = await prisma.score.findFirst({ where: { companyId } });
  if (!s) return null;

  return {
    ...s,
    breakdown: {
      hiring_decline_score: s.hiringDecline,
      negative_sentiment_score: s.negativeSentiment,
      patent_stagnation_score: s.patentStagnation,
      negative_news_score: s.negativeNews,
      product_stagnation_score: s.productStagnation,
      leadership_instability_score: s.leadershipInstability,
      funding_health_score: s.fundingHealth,
      partnership_score: s.partnershipScore,
    },
    predictions: JSON.parse(s.predictions),
    opportunities: JSON.parse(s.opportunities),
  };
}

export async function getScoreHistory(companyId: string): Promise<any[]> {
  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { companyId },
    orderBy: { computedAt: 'asc' },
  });

  return snapshots.map((s) => ({
    companyId: s.companyId,
    score: s.score,
    breakdown: {
      hiring_decline_score: s.hiringDecline,
      negative_sentiment_score: s.negativeSentiment,
      patent_stagnation_score: s.patentStagnation,
      negative_news_score: s.negativeNews,
      product_stagnation_score: s.productStagnation,
      leadership_instability_score: s.leadershipInstability,
      funding_health_score: s.fundingHealth,
      partnership_score: s.partnershipScore,
    },
    computedAt: s.computedAt,
  }));
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────

export async function getTimeline(companyId: string): Promise<any[]> {
  const events = await prisma.timelineEvent.findMany({
    where: { companyId },
    orderBy: { eventDate: 'desc' },
  });

  return events.map((e) => ({
    ...e,
    tags: JSON.parse(e.tags),
  }));
}

// ── REPORTS ──────────────────────────────────────────────────────────────────

export async function saveReport(
  companyId: string,
  report: any,
): Promise<any> {
  await prisma.executiveReport.deleteMany({ where: { companyId } });

  return prisma.executiveReport.create({
    data: {
      companyId,
      title: report.title,
      summary: report.summary ?? '',
      reportJson: JSON.stringify(report),
    },
  });
}

export async function getLatestReport(
  companyId: string,
): Promise<any | null> {
  const r = await prisma.executiveReport.findFirst({
    where: { companyId },
    orderBy: { generatedAt: 'desc' },
  });
  if (!r) return null;

  return {
    ...r,
    ...JSON.parse(r.reportJson),
    id: r.id,
    companyId: r.companyId,
    title: r.title,
    summary: r.summary,
    generatedAt: r.generatedAt,
  };
}
