import { describe, it, expect, beforeEach } from 'vitest';
import {
  addCompany, saveSignal, getSignals, getTimeline,
  detectTrends, score, getScoreHistory, getTrendArrow,
  type Company, type Signal, type SignalType, db,
} from './store';

beforeEach(() => {
  db.companies = [];
  db.signals = [];
  db.scores = [];
  db.scoreHistory = [];
  db.timelineEvents = [];
  db.reports = [];
});

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: overrides.id ?? 'sig-1',
    companyId: overrides.companyId ?? 'c-1',
    signalType: overrides.signalType ?? 'news' as SignalType,
    title: overrides.title ?? 'Test signal',
    description: overrides.description ?? 'Description',
    rawPayload: overrides.rawPayload ?? {},
    sourceUrl: overrides.sourceUrl ?? undefined,
    sentimentScore: overrides.sentimentScore ?? 0,
    tags: overrides.tags ?? [],
    detectedAt: overrides.detectedAt ?? new Date().toISOString(),
  };
}

const testCompany: Omit<Company, 'id' | 'createdAt'> = {
  name: 'TestCorp',
  industry: 'Technology',
  greenhouseToken: undefined,
  leverSlug: undefined,
  website: undefined,
  foundedYear: undefined,
};

describe('addCompany', () => {
  it('adds a company with generated id and createdAt', () => {
    const c = addCompany(testCompany);
    expect(c.id).toBeTruthy();
    expect(c.name).toBe('TestCorp');
    expect(c.createdAt).toBeTruthy();
    expect(db.companies).toHaveLength(1);
  });

  it('rejects empty name', () => {
    const c = addCompany({ ...testCompany, name: '' });
    expect(c.name).toBe('');
  });
});

describe('saveSignal / getSignals', () => {
  it('saves a signal and creates a timeline event', () => {
    const c = addCompany(testCompany);
    const s = saveSignal(c.id, 'news', 'New product launch', {}, 'https://example.com', 0.5, ['positive'], 'A new product');
    expect(s.id).toBeTruthy();
    expect(s.companyId).toBe(c.id);
    expect(s.signalType).toBe('news');
    const signals = getSignals(c.id);
    expect(signals).toHaveLength(1);
    const timeline = getTimeline(c.id);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].signalId).toBe(s.id);
  });

  it('filters by signal type', () => {
    const c = addCompany(testCompany);
    saveSignal(c.id, 'news', 'News item', {});
    saveSignal(c.id, 'hiring', 'Hiring spree', {});
    const news = getSignals(c.id, 'news');
    expect(news).toHaveLength(1);
    const all = getSignals(c.id);
    expect(all).toHaveLength(2);
  });
});

describe('detectTrends', () => {
  it('returns zeros for no signals', () => {
    const c = addCompany(testCompany);
    const t = detectTrends([], c);
    expect(t.hiring).toBe(0);
    expect(t.sentiment).toBe(0);
    expect(t.patent).toBe(50);
    expect(t.news).toBe(50);
    expect(t.product).toBe(50);
    expect(t.leadership).toBe(0);
    expect(t.funding).toBe(0);
    expect(t.partnershipScore).toBe(50);
  });

  it('detects crisis signals raising news score', () => {
    const c = addCompany(testCompany);
    const crisisSignals = Array.from({ length: 5 }, (_, i) =>
      makeSignal({
        id: `crisis-${i}`, companyId: c.id, signalType: 'news',
        title: `Company facing lawsuit over violation`, sentimentScore: -0.7,
      })
    );
    const t = detectTrends(crisisSignals, c);
    expect(t.news).toBeGreaterThan(50);
    expect(t.sentiment).toBeGreaterThan(0);
  });

  it('detects positive sentiment reducing scores', () => {
    const c = addCompany(testCompany);
    const positiveSignals = Array.from({ length: 5 }, (_, i) =>
      makeSignal({
        id: `pos-${i}`, companyId: c.id, signalType: 'news',
        title: `Record growth and expansion for company`, sentimentScore: 0.7,
      })
    );
    positiveSignals.push(
      makeSignal({ id: 'hiring-pos', companyId: c.id, signalType: 'hiring', title: 'Hiring engineers for new product', sentimentScore: 0.3 })
    );
    const t = detectTrends(positiveSignals, c);
    expect(t.news).toBeLessThan(50);
  });

  it('leadership changes increase leadership risk', () => {
    const c = addCompany(testCompany);
    const sigs = [
      makeSignal({ id: 'l1', companyId: c.id, signalType: 'leadership', title: 'CEO steps down unexpectedly', sentimentScore: -0.6 }),
      makeSignal({ id: 'l2', companyId: c.id, signalType: 'leadership', title: 'CFO resigns amid investigation', sentimentScore: -0.5 }),
    ];
    const t = detectTrends(sigs, c);
    expect(t.leadership).toBeGreaterThan(0);
  });
});

describe('score', () => {
  it('computes a score from signals', async () => {
    const c = addCompany(testCompany);
    saveSignal(c.id, 'news', 'Company expands operations', {}, undefined, 0.3, ['positive']);
    saveSignal(c.id, 'news', 'New product launch successful', {}, undefined, 0.5, ['positive']);
    saveSignal(c.id, 'hiring', 'Hiring 50 engineers', {}, undefined, 0.2, ['engineering']);
    const s = await score(c.id);
    expect(s.score).toBeGreaterThanOrEqual(10);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(s.breakdown.hiring_decline_score).toBeDefined();
    expect(s.breakdown.negative_sentiment_score).toBeDefined();
    expect(s.breakdown.patent_stagnation_score).toBeDefined();
    expect(s.breakdown.negative_news_score).toBeDefined();
    expect(s.breakdown.product_stagnation_score).toBeDefined();
    expect(s.breakdown.leadership_instability_score).toBeDefined();
    expect(s.breakdown.funding_health_score).toBeDefined();
    expect(s.breakdown.partnership_score).toBeDefined();
    expect(s.predictions.length).toBeGreaterThan(0);
    expect(s.opportunities.length).toBeGreaterThan(0);
  });

  it('returns same score for duplicate calls (no history yet)', async () => {
    const c = addCompany(testCompany);
    saveSignal(c.id, 'news', 'Test news', {}, undefined, 0.1);
    const s1 = await score(c.id);
    const s2 = await score(c.id);
    expect(s1.score).toBe(s2.score);
  });
});

describe('getScoreHistory', () => {
  it('tracks score changes over time', async () => {
    const c = addCompany(testCompany);
    saveSignal(c.id, 'news', 'First analysis', {}, undefined, 0.1);
    const s1 = await score(c.id);
    expect(getScoreHistory(c.id)).toHaveLength(0);
    saveSignal(c.id, 'news', 'Second analysis with more data', {}, undefined, -0.5);
    const s2 = await score(c.id);
    const history = getScoreHistory(c.id);
    expect(history).toHaveLength(1);
    expect(history[0].score).toBe(s1.score);
    expect(history[0].computedAt).toBe(s1.computedAt);
  });
});

describe('getTrendArrow', () => {
  it('returns stable when no previous score', () => {
    expect(getTrendArrow(50)).toBe('stable');
  });
  it('returns up when score increases >5', () => {
    expect(getTrendArrow(60, 50)).toBe('up');
  });
  it('returns down when score decreases >5', () => {
    expect(getTrendArrow(40, 50)).toBe('down');
  });
  it('returns stable when change is within 5', () => {
    expect(getTrendArrow(53, 50)).toBe('stable');
    expect(getTrendArrow(50, 53)).toBe('stable');
  });
});
