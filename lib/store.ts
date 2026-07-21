import { randomUUID } from 'crypto';

export type SignalType =
  | 'hiring'
  | 'news'
  | 'patent'
  | 'reddit_sentiment'
  | 'product_hunt'
  | 'leadership'
  | 'funding'
  | 'partnership'
  | 'product_launch'
  | 'review';

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  hiring: 'Hiring',
  news: 'News Coverage',
  patent: 'Patent Activity',
  reddit_sentiment: 'Community Sentiment',
  product_hunt: 'Product Launches',
  leadership: 'Leadership Changes',
  funding: 'Funding Events',
  partnership: 'Partnerships',
  product_launch: 'Product Releases',
  review: 'Customer Reviews',
};

export type Signal = {
  id: string;
  companyId: string;
  signalType: SignalType;
  title: string;
  description?: string;
  sourceUrl?: string;
  sentimentScore?: number;
  category?: string;
  tags: string[];
  rawPayload: unknown;
  detectedAt: string;
  synthetic?: boolean;
};

export type Company = {
  id: string;
  name: string;
  greenhouseToken?: string;
  leverSlug?: string;
  industry?: string;
  website?: string;
  foundedYear?: number;
  createdAt: string;
};

export type PredictionEvidence = {
  signalId: string;
  summary: string;
  weight: number;
  sourceUrl?: string;
};

export type Prediction = {
  id: string;
  title: string;
  direction: 'Watch' | 'Opportunity' | 'Stable' | 'Positive';
  category: 'hiring' | 'sentiment' | 'product' | 'financial' | 'market' | 'leadership';
  confidence: number;
  timeframe: 'short-term' | 'medium-term' | 'long-term';
  rationale: string;
  evidence: PredictionEvidence[];
};

export type Opportunity = {
  id: string;
  title: string;
  action: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
  category: 'customer_acquisition' | 'product_gap' | 'market_entry' | 'partnership' | 'positioning';
  reason: string;
  evidenceLink: string;
};

export type AIEnrichment = {
  explanation: string;
  predictions: Prediction[];
  opportunities: Opportunity[];
};

export type ScoreBreakdown = {
  hiring_decline_score: number;
  negative_sentiment_score: number;
  patent_stagnation_score: number;
  negative_news_score: number;
  product_stagnation_score: number;
  leadership_instability_score: number;
  funding_health_score: number;
  partnership_score: number;
};

export type Score = {
  companyId: string;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: string;
  computedAt: string;
  predictions: Prediction[];
  opportunities: Opportunity[];
};

export type TimelineEvent = {
  id: string;
  companyId: string;
  signalId: string;
  title: string;
  description: string;
  eventDate: string;
  signalType: SignalType;
  impactWeight: number;
  tags: string[];
};

export type ScoreSnapshot = {
  companyId: string;
  score: number;
  breakdown: ScoreBreakdown;
  computedAt: string;
};

export type ExecutiveReport = {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  marketHealth: { riskScore: number; breakdown: ScoreBreakdown; trend: 'improving' | 'stable' | 'deteriorating' };
  keySignals: { type: SignalType; title: string; severity: 'low' | 'medium' | 'high' }[];
  predictions: Prediction[];
  opportunities: Opportunity[];
  recommendations: string[];
  disclaimer: string;
  generatedAt: string;
};

const g = global as typeof global & {
  marketStore?: {
    companies: Company[];
    signals: Signal[];
    scores: Score[];
    scoreHistory: ScoreSnapshot[];
    timelineEvents: TimelineEvent[];
    reports: ExecutiveReport[];
  }
};

export const db = g.marketStore ??= {
  companies: [],
  signals: [],
  scores: [],
  scoreHistory: [],
  timelineEvents: [],
  reports: [],
};

export function addCompany(input: Omit<Company, 'id' | 'createdAt'>): Company {
  const company = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  db.companies.push(company);
  return company;
}

export function deleteCompany(companyId: string): boolean {
  const idx = db.companies.findIndex(c => c.id === companyId);
  if (idx === -1) return false;
  db.companies.splice(idx, 1);
  db.signals = db.signals.filter(s => s.companyId !== companyId);
  db.scores = db.scores.filter(s => s.companyId !== companyId);
  db.scoreHistory = db.scoreHistory.filter(s => s.companyId !== companyId);
  db.timelineEvents = db.timelineEvents.filter(e => e.companyId !== companyId);
  db.reports = db.reports.filter(r => r.companyId !== companyId);
  return true;
}

export function saveSignal(
  companyId: string,
  signalType: SignalType,
  title: string,
  rawPayload: unknown,
  sourceUrl?: string,
  sentimentScore?: number,
  tags?: string[],
  description?: string,
  synthetic?: boolean,
): Signal {
  const s: Signal = {
    id: randomUUID(),
    companyId,
    signalType,
    title,
    description,
    rawPayload,
    sourceUrl,
    sentimentScore,
    tags: tags ?? [],
    detectedAt: new Date().toISOString(),
    synthetic,
  };
  db.signals.push(s);
  const impactWeight = Math.abs(sentimentScore ?? 0.5) * 10;
  db.timelineEvents.push({
    id: randomUUID(),
    companyId,
    signalId: s.id,
    title,
    description: description ?? title,
    eventDate: s.detectedAt,
    signalType,
    impactWeight,
    tags: tags ?? [],
  });
  return s;
}

export function getSignals(companyId: string, signalType?: SignalType): Signal[] {
  const filtered = (db.signals || []).filter(s => s.companyId === companyId);
  return signalType ? filtered.filter(s => s.signalType === signalType) : filtered;
}

export function getTimeline(companyId: string): TimelineEvent[] {
  return (db.timelineEvents || [])
    .filter(e => e.companyId === companyId)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
}

export function detectTrends(signals: Signal[], company: Company): { hiring: number; sentiment: number; patent: number; news: number; product: number; leadership: number; funding: number; partnershipScore: number } {
  const real = signals.filter(s => !s.synthetic);
  const hiring = real.filter(s => s.signalType === 'hiring');
  const news = real.filter(s => s.signalType === 'news');
  const reddit = real.filter(s => s.signalType === 'reddit_sentiment');
  const patents = real.filter(s => s.signalType === 'patent');
  const product = real.filter(s => s.signalType === 'product_hunt' || s.signalType === 'product_launch');
  const leadership = real.filter(s => s.signalType === 'leadership');
  const funding = real.filter(s => s.signalType === 'funding');
  const partnership = real.filter(s => s.signalType === 'partnership');

  const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

  const KW = {
    crisis: /\blayoff|\blawsuit|\bcut|\bdecline|\bloss|\bshutdown|\bdepart|\brisk|\brecall|\bfine|\bdown|\bdrop|\bsue|\bviolat|\bpenalty|\bban|\bcrisis|\bdefect|\bembargo|\bsanction|\bfail|\bbankrupt/i,
    growth: /\bgrow|\bexpand|\brecord|\bsurge|\bmilestone|\bmomentum|\bboom|\bbullish|\boutperform|\bbeat|\brally/i,
    legal: /\blawsuit|\blitigation|\bregulator|\bfine|\bpenalty|\bcompliance|\binvestigat|\bsanction|\bcourt|\bappeal|\bsettle|\bprobe|\binquiry/i,
    product: /\blaunch|\brelease|\bproduct|\bplatform|\bversion|\bapp|\bsoftware|\bupdate|\brollout|\bunveil|\bdebut|\bintroduc/i,
    partnership: /\bpartner|\bcollaborat|\balliance|\bjoint|\bmerge|\bacquisit/i,
    leadership: /\bceo|\bcfo|\bcto|\bfounder|\bpresident|\bdirector|\bexecutive|\bboard|\bchairman|\bchief\b/i,
    restructuring: /\brestructur|\breorg|\bdownsize|\blayoff|\bfurlough|\bclose|\bexit|\bdivest|\bspin.?off/i,
    funding: /\bfunding|\braised|\bseries\s[a-e]|\binvestment|\bvaluation|\bipo|\bseed|\bventure|\bcapital/i,
    hiring: /\bhiring|\bjob|\bcareer|\bposition|\brecruit|\bopen.?role|\btalent|\bworkforce|\bemploy/i,
    tech: /\bai\b|\bmachine learning|\bdeep learning|\bneural|\bdata|\bcloud|\bcyber|\bsecurity|\bblockchain|\bquantum|\bautomation|\bdigital/i,
    upbeat: /\bpositive|\boptimistic|\bconfident|\bstrong|\bexcellent|\boutstanding|\bsuperior|\bleading|\binnovation|\bpioneer/i,
  };

  function ratio(texts: string[], kw: RegExp): number {
    return texts.length > 0 ? texts.filter(t => kw.test(t)).length / texts.length : 0;
  }

  const hiringTitles = hiring.map(s => s.title);
  const newsTitles = news.map(s => s.title);

  // === HIRING ===
  const hCrisis = ratio(hiringTitles, KW.restructuring);
  const hGrowth = ratio(hiringTitles, KW.hiring);
  const hEng = hiring.length > 0 ? hiring.filter(s => (s.tags||[]).includes('engineering')).length/hiring.length : 0;
  const hGtm = hiring.length > 0 ? hiring.filter(s => (s.tags||[]).includes('go-to-market')).length/hiring.length : 0;
  const hTech = ratio(hiringTitles, KW.tech);

  const hiringScore = hiring.length === 0 ? 0
    : hiring.length > 50 ? clamp(60 + hCrisis*35 - hGrowth*15 - hEng*10 - hGtm*8)
    : hiring.length > 10 ? clamp(25 + hCrisis*40 - hGrowth*12 - hTech*8)
    : clamp(8 + hCrisis*30 - hEng*8);

  // === SENTIMENT (based on ALL signals) ===
  const allTitles = real.map(s => s.title);
  const cRatio = ratio(allTitles, KW.crisis);
  const gRatio = ratio(allTitles, KW.growth);
  const lRatio = ratio(allTitles, KW.legal);
  const pRatio = ratio(allTitles, KW.product);
  const tRatio = ratio(allTitles, KW.tech);
  const uRatio = ratio(allTitles, KW.upbeat);

  const avgSent = (() => {
    const v = real.map(s => s.sentimentScore??0).filter(x => x !== 0);
    return v.length > 0 ? v.reduce((a,b)=>a+b,0)/v.length : 0;
  })();

  const nCount = real.filter(s => (s.sentimentScore??0) < 0).length;
  const pCount = real.filter(s => (s.sentimentScore??0) > 0).length;
  const tScored = nCount + pCount;

  const sentimentScore = tScored === 0 && real.length === 0 ? 0
    : clamp(
        (tScored > 0 ? (nCount / tScored) * 40 : 20) +
        cRatio * 25 +
        lRatio * 10 +
        (gRatio < 0.2 ? (0.2 - gRatio) * 40 : 0) +
        (uRatio > 0 ? (1 - uRatio) * 15 : 10) +
        (avgSent < -0.4 ? 20 : avgSent > 0.3 ? -10 : 5)
      );

  // === PATENT ===
  const patentScore = patents.length === 0 ? 50
    : clamp(50 - patents.length * 3 - patents.filter(s => (s.tags||[]).includes('method')).length * 4);

  // === NEWS ===
  const ncRatio = ratio(newsTitles, KW.crisis);
  const ngRatio = ratio(newsTitles, KW.growth);
  const nlRatio = ratio(newsTitles, KW.legal);
  const npRatio = ratio(newsTitles, KW.product);
  const ntRatio = ratio(newsTitles, KW.tech);
  const nuRatio = ratio(newsTitles, KW.upbeat);
  const nRestr = ratio(newsTitles, KW.restructuring);
  const nFund = ratio(newsTitles, KW.funding);

  const nAvgSent = (() => {
    const v = news.map(s => s.sentimentScore??0).filter(x => x !== 0);
    return v.length > 0 ? v.reduce((a,b)=>a+b,0)/v.length : 0;
  })();

  const nNeg = news.filter(s => (s.sentimentScore??0) < 0).length;
  const nPos = news.filter(s => (s.sentimentScore??0) > 0).length;
  const nScored = nNeg + nPos;

  const newsScore = news.length === 0 ? 50
    : clamp(
        (nScored > 0 ? (nNeg / nScored) * 35 : 15) +
        ncRatio * 20 +
        nlRatio * 10 +
        nRestr * 12 +
        nFund * 5 +
        (ngRatio < 0.3 ? (0.3 - ngRatio) * 25 : 0) +
        (npRatio < 0.2 ? (0.2 - npRatio) * 10 : 0) +
        (ntRatio > 0 ? -ntRatio * 8 : 5) +
        (nuRatio > 0 ? -nuRatio * 10 : 5) +
        (nAvgSent < -0.4 ? 12 : nAvgSent > 0.4 ? -12 : 3)
      );

  // === PRODUCT ===
  const productScore = product.length === 0 ? 50
    : clamp(50 - product.length * 5 - product.filter(s => (s.sentimentScore??0) > 0).length * 8);

  // === LEADERSHIP ===
  const lInstab = ratio(leadership.map(s => s.title), KW.restructuring);
  const lDepart = ratio(leadership.map(s => s.title), /\b(resign|depart|step.?down|exit|leave|quit)\b/i);

  const leadershipScore = leadership.length === 0 ? 0
    : clamp(leadership.length * 8 + lInstab * 25 + lDepart * 30);

  // === FUNDING ===
  const fNeg = ratio(funding.map(s => s.title), /\b(decline|down|drop|lost|struggle|fail|slow)\b/i);
  const fGrow = ratio(funding.map(s => s.title), KW.growth);
  const pBoost = partnership.length * 4;

  const fundingScore = funding.length === 0 ? 0
    : clamp(funding.length * 6 + fNeg * 25 - fGrow * 12 - pBoost);

  const partnershipScore = partnership.length === 0 ? 50
    : clamp(50 - partnership.length * 6 - partnership.filter(s => (s.sentimentScore??0) > 0).length * 5);

  return {
    hiring: clamp(hiringScore),
    sentiment: clamp(sentimentScore),
    patent: patentScore,
    news: clamp(newsScore),
    product: productScore,
    leadership: clamp(leadershipScore),
    funding: clamp(fundingScore),
    partnershipScore: clamp(partnershipScore),
  };
}

function generatePredictions(signals: Signal[], trends: ReturnType<typeof detectTrends>, company: Company): Prediction[] {
  const predictions: Prediction[] = [];
  const negativeNews = signals.filter(s => s.signalType === 'news' && (s.sentimentScore ?? 0) < 0);
  const positiveNews = signals.filter(s => s.signalType === 'news' && (s.sentimentScore ?? 0) > 0);
  const hiring = signals.filter(s => s.signalType === 'hiring');
  const patents = signals.filter(s => s.signalType === 'patent');
  const reddit = signals.filter(s => s.signalType === 'reddit_sentiment');
  const productLaunches = signals.filter(s => s.signalType === 'product_hunt' || s.signalType === 'product_launch');
  const leadership = signals.filter(s => s.signalType === 'leadership');
  const funding = signals.filter(s => s.signalType === 'funding');

  if (negativeNews.length >= 3) {
    const confidence = Math.min(92, 55 + negativeNews.length * 8);
    const negativeHeadlines = negativeNews.slice(0, 3).map(s => s.title).join('; ');
    predictions.push({
      id: randomUUID(),
      title: 'Reputational pressure may intensify',
      direction: 'Watch',
      category: 'sentiment',
      confidence,
      timeframe: 'short-term',
      rationale: `${negativeNews.length} of ${signals.filter(s => s.signalType === 'news').length} news headlines matched an adverse-event keyword. Headlines like "${negativeHeadlines}" suggest near-term reputational risk. If negative coverage persists beyond the current news cycle, confidence in this prediction will increase.`,
      evidence: negativeNews.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: Math.abs(s.sentimentScore ?? 0.5),
      })),
    });
  } else if (positiveNews.length >= 3) {
    const confidence = Math.min(80, 50 + positiveNews.length * 5);
    const positiveHeadlines = positiveNews.slice(0, 3).map(s => s.title).join('; ');
    predictions.push({
      id: randomUUID(),
      title: 'Positive news coverage may indicate growth momentum',
      direction: 'Positive',
      category: 'market',
      confidence,
      timeframe: 'short-term',
      rationale: `${positiveNews.length} positive news signals detected in this collection run. Headlines like "${positiveHeadlines}" indicate favorable market positioning. Monitor whether this trend reflects a sustained shift or a short-term catalyst.`,
      evidence: positiveNews.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: s.sentimentScore ?? 0.5,
      })),
    });
  } else {
    predictions.push({
      id: randomUUID(),
      title: 'No material near-term disruption detected',
      direction: 'Stable',
      category: 'market',
      confidence: Math.min(65, 45 + signals.length),
      timeframe: 'short-term',
      rationale: `Current evidence contains ${signals.length} public signals for ${company.name}. News sentiment is mixed with ${negativeNews.length} negative and ${positiveNews.length} positive articles. This is a low-confidence baseline—not a forecast—and should be updated with each collection cycle.`,
      evidence: [{ signalId: signals[0]?.id ?? '', summary: `${signals.length} signals collected, ${negativeNews.length} negative ${positiveNews.length} positive`, weight: 0.5 }],
    });
  }

  if (patents.length >= 2) {
    const categories = Array.from(new Set(patents.map(s => s.tags).flat())).filter(Boolean);
    const confidence = Math.min(85, 60 + patents.length * 5);
    predictions.push({
      id: randomUUID(),
      title: categories.length > 1 ? 'Patent activity spans multiple technology areas' : 'Patent activity concentrated in one area',
      direction: categories.length > 1 ? 'Opportunity' : 'Stable',
      category: 'product',
      confidence,
      timeframe: 'medium-term',
      rationale: categories.length > 1
        ? `${patents.length} patent filings span ${categories.join(', ')}. This suggests the company is investing in multiple technology directions, which could signal expansion or dilution.`
        : `${patents.length} patent filings concentrated in ${categories[0] ?? 'a single'} area. This may indicate deepening expertise or narrowing focus.`,
      evidence: patents.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: 0.7,
      })),
    });
  }

  if (hiring.length >= 2) {
    const roles = hiring.map(s => s.description ?? s.title).filter(Boolean);
    const hasEngineering = roles.some(r => r.toLowerCase().includes('engineer'));
    const hasSales = roles.some(r => r.toLowerCase().includes('sales') || r.toLowerCase().includes('marketing'));
    let prediction = '';
    if (hasEngineering && !hasSales) {
      prediction = 'Hiring is engineering-heavy with limited go-to-market hiring, suggesting a product-investment phase rather than a growth phase.';
    } else if (hasSales && !hasEngineering) {
      prediction = 'Hiring is sales-and-marketing-heavy, suggesting the company is scaling go-to-market capacity to capture a growing market.';
    } else {
      prediction = 'Balanced hiring across engineering and go-to-market suggests the company is in a growth phase with a healthy mix of product investment and market capture.';
    }
    predictions.push({
      id: randomUUID(),
      title: 'Hiring pattern indicates strategic priorities',
      direction: hiring.length > 5 ? 'Positive' : 'Stable',
      category: 'hiring',
      confidence: Math.min(80, 50 + hiring.length * 5),
      timeframe: 'medium-term',
      rationale: prediction,
      evidence: hiring.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: 0.6,
      })),
    });
  }

  if (leadership.length > 0) {
    const confidence = Math.min(80, 50 + leadership.length * 10);
    predictions.push({
      id: randomUUID(),
      title: 'Leadership changes may signal organizational shift',
      direction: 'Watch',
      category: 'leadership',
      confidence,
      timeframe: 'medium-term',
      rationale: `${leadership.length} leadership change(s) detected. Leadership turnover can signal restructuring, strategic pivots, or internal instability depending on the roles involved and the context.`,
      evidence: leadership.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: 0.75,
      })),
    });
  }

  if (funding.length > 0) {
    predictions.push({
      id: randomUUID(),
      title: 'Funding activity suggests capital market position',
      direction: 'Positive',
      category: 'financial',
      confidence: Math.min(75, 50 + funding.length * 8),
      timeframe: 'medium-term',
      rationale: `${funding.length} funding event(s) detected. Companies with recent funding have capital for product development and market expansion, but may also face investor pressure for growth.`,
      evidence: funding.slice(0, 2).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: 0.65,
      })),
    });
  }

  if (productLaunches.length > 0) {
    predictions.push({
      id: randomUUID(),
      title: productLaunches.length >= 2 ? 'Multiple product launches indicate active development' : 'Recent product launch activity detected',
      direction: 'Positive',
      category: 'product',
      confidence: Math.min(80, 50 + productLaunches.length * 8),
      timeframe: 'medium-term',
      rationale: `${productLaunches.length} product launch(es) observed. Consistent product releases indicate an active development cycle and market engagement.`,
      evidence: productLaunches.slice(0, 3).map(s => ({
        signalId: s.id,
        summary: s.title,
        weight: 0.6,
      })),
    });
  }

  if (reddit.length > 3) {
    const avgSentiment = reddit.reduce((acc, s) => acc + (s.sentimentScore ?? 0), 0) / reddit.length;
    if (avgSentiment < -0.3) {
      predictions.push({
        id: randomUUID(),
        title: 'Community sentiment is declining',
        direction: 'Watch',
        category: 'sentiment',
        confidence: Math.min(85, 60 + Math.abs(avgSentiment) * 30),
        timeframe: 'short-term',
        rationale: `Average community sentiment is ${avgSentiment.toFixed(2)} across ${reddit.length} mentions. Negative community sentiment can precede broader market perception shifts.`,
        evidence: reddit.slice(0, 3).map(s => ({
          signalId: s.id,
          summary: s.title,
          weight: Math.abs(s.sentimentScore ?? 0.5),
        })),
      });
    }
  }

  return predictions;
}

function generateOpportunities(signals: Signal[], predictions: Prediction[], company: Company): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const negativeNews = signals.filter(s => s.signalType === 'news' && (s.sentimentScore ?? 0) < 0);
  const reddit = signals.filter(s => s.signalType === 'reddit_sentiment');
  const hiring = signals.filter(s => s.signalType === 'hiring');
  const product = signals.filter(s => s.signalType === 'product_hunt' || s.signalType === 'product_launch');

  if (negativeNews.length >= 2) {
    opportunities.push({
      id: randomUUID(),
      title: 'Prepare a customer acquisition campaign',
      action: `Build messaging and onboarding support around the recurring pain point detected in ${negativeNews.length} news signals. Target customers who may be evaluating alternatives.`,
      impact: 'High',
      effort: 'Medium',
      category: 'customer_acquisition',
      reason: `Adverse news coverage signals potential customer dissatisfaction. The window to capture displaced customers typically lasts 3-6 months from the first negative signal.`,
      evidenceLink: negativeNews[0]?.sourceUrl ?? '',
    });
  }

  if (reddit.length >= 3) {
    const complaints = reddit.filter(s => (s.sentimentScore ?? 0) < -0.3);
    if (complaints.length >= 2) {
      opportunities.push({
        id: randomUUID(),
        title: 'Address competitor pain points',
        action: `Community discussions reveal specific complaints. Build targeted solutions and messaging that directly addresses the gaps mentioned across ${complaints.length} community posts.`,
        impact: 'High',
        effort: 'Medium',
        category: 'product_gap',
        reason: `User-generated complaints on public forums are early indicators of product gaps that competitors are not addressing.`,
        evidenceLink: complaints[0]?.sourceUrl ?? '',
      });
    }
  }

  if (hiring.length > 0 && !hiring.some(s => (s.description ?? '').toLowerCase().includes('sales'))) {
    opportunities.push({
      id: randomUUID(),
      title: 'Position against engineering-focused competitor',
      action: 'Competitor is investing heavily in engineering with limited go-to-market hiring. Your advantage may be in distribution, customer experience, and sales velocity—not product depth.',
      impact: 'Medium',
      effort: 'Low',
      category: 'positioning',
      reason: 'A hiring imbalance between engineering and go-to-market functions can leave a company vulnerable to competitors with stronger distribution.',
      evidenceLink: '',
    });
  }

  if (product.length > 0) {
    opportunities.push({
      id: randomUUID(),
      title: 'Study competitor product direction',
      action: `Analyze the ${product.length} recent product launches for category expansion, feature patterns, and positioning shifts. Identify areas they are moving away from—these may be underserved segments you can own.`,
      impact: 'Medium',
      effort: 'Low',
      category: 'market_entry',
      reason: 'Product launches reveal strategic priorities. What a competitor deprioritizes can be as informative as what they invest in.',
      evidenceLink: product[0]?.sourceUrl ?? '',
    });
  }

  opportunities.push({
    id: randomUUID(),
    title: 'Set a weekly evidence review cadence',
    action: 'Track changes in the signal timeline weekly and revise your strategic hypotheses only when multiple independent sources agree on a direction. Avoid reacting to a single headline or job-board snapshot.',
    impact: 'Medium',
    effort: 'Low',
    category: 'positioning',
    reason: 'Consistent monitoring prevents overreaction to noise while ensuring you catch real shifts early.',
    evidenceLink: '',
  });

  if (predictions.some(p => p.confidence > 70 && p.direction === 'Watch')) {
    opportunities.push({
      id: randomUUID(),
      title: 'Develop contingency plan for competitor disruption',
      action: `AI predictions show elevated watch signals for this company with confidence scores above 70%. Develop a contingency plan covering: (1) customer retention playbook, (2) alternative supply chain, (3) market positioning adjustment.`,
      impact: 'High',
      effort: 'High',
      category: 'market_entry',
      reason: 'High-confidence risk predictions warrant proactive planning rather than reactive response.',
      evidenceLink: '',
    });
  }

  return opportunities;
}

function getScoreColor(score: number): string {
  if (score > 60) return 'var(--risk-high)';
  if (score > 35) return 'var(--risk-mid)';
  return 'var(--risk-low)';
}

function makeExplanation(company: Company, cappedTotal: number, signals: Signal[], breakdown: ScoreBreakdown): string {
  const negativeNews = signals.filter(s => s.signalType === 'news' && (s.sentimentScore ?? 0) < 0);
  const positiveNews = signals.filter(s => s.signalType === 'news' && (s.sentimentScore ?? 0) > 0);
  const newsItems = signals.filter(s => s.signalType === 'news');
  const crisisHeadlines = signals.filter(s => /\blayoff|\blawsuit|\bcut|\bdecline|\bloss|\bshutdown|\brisk|\brecall|\bfine|\bbankrupt|\bcrisis|\bdefect|\bsanction/i.test(s.title)).slice(0, 3).map(s => s.title).join('; ');

  return `${company?.name ?? 'This company'} scores ${cappedTotal}/100 risk from ${signals.length} public signals. ` +
    (newsItems.length > 0
      ? `${negativeNews.length}/${newsItems.length} news items are negative-toned, ${positiveNews.length} positive. `
      : 'No news signals available. ') +
    (crisisHeadlines ? `Adverse headlines include: "${crisisHeadlines}". ` : '') +
    `Breakdown: hiring ${breakdown.hiring_decline_score}, sentiment ${breakdown.negative_sentiment_score}, patent ${breakdown.patent_stagnation_score}, news ${breakdown.negative_news_score}, product ${breakdown.product_stagnation_score}, leadership ${breakdown.leadership_instability_score}, funding ${breakdown.funding_health_score}, partnership ${breakdown.partnership_score}.`;
}

export async function score(companyId: string): Promise<Score> {
  const company = db.companies.find(x => x.id === companyId);
  if (!company) throw new Error('Company not found');

  const signals = getSignals(companyId);
  const trends = detectTrends(signals, company);
  const predictions = generatePredictions(signals, trends, company);
  const opportunities = generateOpportunities(signals, predictions, company);

  const breakdown: ScoreBreakdown = {
    hiring_decline_score: trends.hiring,
    negative_sentiment_score: trends.sentiment,
    patent_stagnation_score: trends.patent,
    negative_news_score: trends.news,
    product_stagnation_score: trends.product,
    leadership_instability_score: trends.leadership,
    funding_health_score: trends.funding,
    partnership_score: trends.partnershipScore,
  };

  const total = Math.round(
    0.18 * breakdown.hiring_decline_score +
    0.23 * breakdown.negative_sentiment_score +
    0.05 * breakdown.patent_stagnation_score +
    0.23 * breakdown.negative_news_score +
    0.05 * breakdown.product_stagnation_score +
    0.10 * breakdown.leadership_instability_score +
    0.10 * breakdown.funding_health_score +
    0.06 * breakdown.partnership_score
  );

  const cappedTotal = Math.min(100, Math.max(10, total));

  const result: Score = {
    companyId,
    score: cappedTotal,
    breakdown,
    explanation: makeExplanation(company, cappedTotal, signals, breakdown),
    computedAt: new Date().toISOString(),
    predictions,
    opportunities,
  };

  const existing = db.scores.find(x => x.companyId === companyId);
  if (existing) {
    db.scoreHistory.push({
      companyId,
      score: existing.score,
      breakdown: existing.breakdown,
      computedAt: existing.computedAt,
    });
  }
  db.scores = db.scores.filter(x => x.companyId !== companyId);
  db.scores.push(result);
  return result;
}

export function getScore(companyId: string): Score | undefined {
  return db.scores.find(s => s.companyId === companyId);
}

export function getScoreHistory(companyId: string, limit = 20): ScoreSnapshot[] {
  return db.scoreHistory
    .filter(s => s.companyId === companyId)
    .slice(-limit)
    .sort((a, b) => new Date(a.computedAt).getTime() - new Date(b.computedAt).getTime());
}

export function getTrendArrow(currentScore: number, previousScore?: number): 'up' | 'down' | 'stable' {
  if (previousScore === undefined) return 'stable';
  if (currentScore > previousScore + 5) return 'up';
  if (currentScore < previousScore - 5) return 'down';
  return 'stable';
}

export function getLatestReport(companyId: string): ExecutiveReport | undefined {
  return db.reports.filter(r => r.companyId === companyId).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
}

export function generateReport(companyId: string): ExecutiveReport {
  const company = db.companies.find(c => c.id === companyId);
  const scoreData = db.scores.find(s => s.companyId === companyId);
  if (!company || !scoreData) throw new Error('Run an analysis first');

  const signals = getSignals(companyId);
  const keySignals = signals.slice(0, 5).map(s => ({
    type: s.signalType,
    title: s.title,
    severity: (s.sentimentScore ?? 0) < -0.3 ? 'high' as const : (s.sentimentScore ?? 0) < 0 ? 'medium' as const : 'low' as const,
  }));

  const recommendations: string[] = [
    ...scoreData.opportunities.map(o => `${o.title}: ${o.action}`),
    'Monitor signal timeline weekly for changes in the evidence base.',
    'Validate AI predictions against your own market intelligence before committing resources.',
  ];

  const trend: 'improving' | 'stable' | 'deteriorating' =
    scoreData.score > 60 ? 'deteriorating' : scoreData.score > 35 ? 'stable' : 'improving';

  const report: ExecutiveReport = {
    id: randomUUID(),
    companyId,
    title: `Executive Strategy Report — ${company.name}`,
    summary: scoreData.explanation,
    marketHealth: {
      riskScore: scoreData.score,
      breakdown: scoreData.breakdown,
      trend,
    },
    keySignals,
    predictions: scoreData.predictions,
    opportunities: scoreData.opportunities,
    recommendations,
    disclaimer: 'This report combines public-source evidence available at generation time. Predictions are hypotheses and must be validated before acting. Not financial or investment advice.',
    generatedAt: new Date().toISOString(),
  };

  db.reports = db.reports.filter(r => r.companyId !== companyId);
  db.reports.push(report);
  return report;
}
