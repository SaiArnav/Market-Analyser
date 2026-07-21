import type { Company, Score, ScoreBreakdown, Prediction, Opportunity, SignalType } from './store';
import { saveSignal } from './store';

function apiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

const MODEL = 'gpt-5.6-codex';
const MAX_TURNS = 12;

const TOOLS: Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = [
  {
    type: 'function',
    function: {
      name: 'search_gdelt_news',
      description: 'Fetch recent news articles mentioning the company from the GDELT global news database. Returns up to 15 article headlines, sources, and URLs.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name to search for' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_greenhouse_jobs',
      description: 'Fetch open job postings from Greenhouse ATS for the company. Requires a Greenhouse board token to be configured.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_lever_jobs',
      description: 'Fetch open job postings from Lever ATS for the company. Requires a Lever company slug to be configured.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_patents',
      description: 'Search recent patent filings where the company is listed as assignee. Returns patent titles, IDs, and abstracts from PatentsView.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name to search as patent assignee' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_reddit',
      description: 'Search Reddit posts mentioning the company. Returns post titles, subreddit, and content snippets with community sentiment analysis.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name to search for on Reddit' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_newsapi',
      description: 'Fetch recent news articles from NewsAPI. Requires NEWSAPI_KEY to be configured. Returns up to 10 articles.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name to search for in news' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_producthunt',
      description: 'Search Product Hunt for recent product launches related to the company. Requires PRODUCTHUNT_TOKEN to be configured.',
      parameters: {
        type: 'object',
        properties: { company_name: { type: 'string', description: 'Company name to search for on Product Hunt' } },
        required: ['company_name'],
        additionalProperties: false,
      },
    },
  },
];

const RESPONSE_SCHEMA = {
  name: 'agent_analysis',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      risk_score: {
        type: 'number',
        description: 'Overall market risk score 0-100. Higher = more risk.',
      },
      breakdown: {
        type: 'object',
        properties: {
          hiring_decline_score: { type: 'number', description: 'Hiring contraction risk 0-100' },
          negative_sentiment_score: { type: 'number', description: 'Negative sentiment risk 0-100' },
          patent_stagnation_score: { type: 'number', description: 'Patent stagnation risk 0-100' },
          negative_news_score: { type: 'number', description: 'Negative news coverage risk 0-100' },
          product_stagnation_score: { type: 'number', description: 'Product stagnation risk 0-100' },
          leadership_instability_score: { type: 'number', description: 'Leadership churn risk 0-100' },
          funding_health_score: { type: 'number', description: 'Funding health risk 0-100' },
          partnership_score: { type: 'number', description: 'Partnership health (inverted: lower = better) 0-100' },
        },
        required: [
          'hiring_decline_score', 'negative_sentiment_score', 'patent_stagnation_score',
          'negative_news_score', 'product_stagnation_score', 'leadership_instability_score',
          'funding_health_score', 'partnership_score',
        ],
        additionalProperties: false,
      },
      explanation: {
        type: 'string',
        description: '2-3 sentence executive summary of what the signals collectively indicate. Cite specific signal types and counts.',
      },
      predictions: {
        type: 'array',
        description: '2-4 data-driven predictions about the company\'s trajectory',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short label (e.g. "Reputational risk may intensify")' },
            direction: { type: 'string', enum: ['Watch', 'Opportunity', 'Stable', 'Positive'] },
            category: { type: 'string', enum: ['hiring', 'sentiment', 'product', 'financial', 'market', 'leadership'] },
            confidence: { type: 'number', description: 'Integer 0-100' },
            timeframe: { type: 'string', enum: ['short-term', 'medium-term', 'long-term'] },
            rationale: { type: 'string', description: '2-3 sentences explaining which specific signals support this prediction' },
            evidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  summary: { type: 'string', description: 'Signal title or headline excerpt' },
                  weight: { type: 'number', description: 'Importance weight 0-1' },
                  sourceUrl: { type: 'string', description: 'The exact clickable URL of the source article, post, or listing that this evidence came from. Must match the url returned by the tool.' },
                },
                required: ['summary', 'weight'],
                additionalProperties: false,
              },
            },
          },
          required: ['title', 'direction', 'category', 'confidence', 'timeframe', 'rationale', 'evidence'],
          additionalProperties: false,
        },
      },
      opportunities: {
        type: 'array',
        description: '2-4 actionable strategic recommendations',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short action-oriented label' },
            action: { type: 'string', description: '1-2 sentence description of what to do' },
            impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            effort: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            category: {
              type: 'string',
              enum: ['customer_acquisition', 'product_gap', 'market_entry', 'partnership', 'positioning'],
            },
            reason: { type: 'string', description: '1 sentence explaining why this opportunity exists' },
          },
          required: ['title', 'action', 'impact', 'effort', 'category', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['risk_score', 'breakdown', 'explanation', 'predictions', 'opportunities'],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You are an expert market intelligence analyst running an autonomous research agent with full decision-making authority over tool orchestration and evidence sufficiency.

YOUR JOB:
1. Review the prior analysis (if provided in user context) to understand what changed since last check.
2. Decide which data-source tools to call, in what order, based on what you already know and what gaps exist.
3. After each tool call, reason explicitly: what did this tell you, what are you still missing, which tool should you call next (if any)?
4. If confidence in your assessment is low (e.g., contradictory signals, sparse data), call additional sources to gather more evidence before concluding.
5. When you have sufficient evidence from multiple independent sources, produce the final structured analysis.

TOOL ORCHESTRATION RULES:
- Start with the sources most likely to yield actionable signal for this company (e.g., GDELT for news, Greenhouse/Lever for hiring, PatentsView for innovation).
- If a tool returns strong signal, follow up with complementary sources (e.g., strong hiring → check Glassdoor sentiment; new patents → check Reddit/NewsAPI for analyst reactions).
- If a tool returns error or empty results, note that and pivot — do NOT retry the same tool in the same session.
- If results are contradictory or ambiguous, explain the uncertainty and call at least one more independent source before scoring.
- Distinguish real data from demo/synthetic data (labeled). Base your analysis only on real evidence.

PRIOR ANALYSIS MEMORY:
- If a prior analysis is included below, compare your findings explicitly: "Risk score moved from X to Y because..."
- Reference specific changes in the breakdown dimensions, new signals since last check, and whether predictions from the prior analysis materialized.

EVIDENCE CITATIONS:
- Every evidence item in predictions MUST include the sourceUrl from the tool result so it traces back to the original source.
- Reference actual headlines, job counts, patent titles, or community posts you received.

FINAL OUTPUT:
- Risk score (0-100), 8-dimensional breakdown, executive explanation, 2-4 predictions with evidence citations, 2-4 actionable opportunities.`;

interface ToolHandlers {
  [name: string]: (args: Record<string, unknown>) => Promise<string>;
}

const NEGATIVE = /layoff|lawsuit|cut|decline|loss|shutdown|depart|risk|bankrupt|fraud|investigation/i;
const POSITIVE = /launch|partner|grow|expand|record|surge|acquire|innovate|upgrade|award|profit|breakthrough|patent/i;
const LEADERSHIP = /ceo|cfo|cto|founder|president|director|executive|resign|step down|departure/i;
const FUNDING = /funding|raised|series [a-e]|investment|valuation|ipo|acquisition/i;
const PARTNERSHIP = /partnership|partner with|collaborat|alliance|integrat/i;

function makeToolHandlers(company: Company): ToolHandlers {
  return {
    search_gdelt_news: async () => {
      try {
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(company.name)}&mode=artlist&format=json&maxrecords=15`;
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();
        const articles = (data.articles ?? []).slice(0, 15);
        if (articles.length === 0) {
          return JSON.stringify({ status: 'ok', count: 0, articles: [], message: 'GDELT returned 0 articles for this company.' });
        }
        const formatted: Array<{ title: string; url: string; snippet: string; domain: string }> = [];
        for (const a of articles) {
          const title = a.title ?? 'Untitled article';
          const sentiment = NEGATIVE.test(title) ? -0.6 : POSITIVE.test(title) ? 0.5 : 0.0;
          const tags: string[] = [];
          if (NEGATIVE.test(title)) tags.push('adverse');
          if (POSITIVE.test(title)) tags.push('positive');
          if (LEADERSHIP.test(title)) tags.push('leadership');
          if (FUNDING.test(title)) tags.push('funding');
          if (PARTNERSHIP.test(title)) tags.push('partnership');
          const type = LEADERSHIP.test(title) ? 'leadership' : FUNDING.test(title) ? 'funding' : PARTNERSHIP.test(title) ? 'partnership' : 'news';
          saveSignal(company.id, type as SignalType, title, a, a.url, sentiment, tags, a.seo ?? undefined);
          formatted.push({ title, url: a.url ?? '', snippet: a.seo ?? '', domain: a.domain ?? '' });
        }
        return JSON.stringify({ status: 'ok', count: formatted.length, articles: formatted });
      } catch (e) {
        return JSON.stringify({ status: 'ok', count: 0, articles: [], message: `GDELT error: ${String(e)}. No synthetic fallback used.` });
      }
    },

    search_greenhouse_jobs: async () => {
      if (!company.greenhouseToken) {
        return JSON.stringify({ status: 'skipped', count: 0, message: 'No Greenhouse board token configured for this company.' });
      }
      try {
        const r = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.greenhouseToken)}/jobs`,
          { cache: 'no-store' },
        );
        const d = await r.json();
        const jobs = d.jobs ?? [];
        const depts = Array.from(
          new Set(jobs.map((j: { departments?: { name: string }[] }) => j.departments?.[0]?.name).filter(Boolean)),
        );
        const sampleTitles = jobs.map((j: { title?: string }) => j.title ?? '').slice(0, 20);
        if (jobs.length > 0) {
          saveSignal(
            company.id, 'hiring',
            `${jobs.length} open Greenhouse roles across ${depts.length || 1} department(s)`,
            d,
            `https://boards.greenhouse.io/${company.greenhouseToken}`,
            0.2, depts as string[], depts.slice(0, 3).join(', ') || undefined,
          );
        }
        return JSON.stringify({
          status: 'ok', count: jobs.length, departments: depts, sample_titles: sampleTitles,
          board_url: `https://boards.greenhouse.io/${company.greenhouseToken}`,
        });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },

    search_lever_jobs: async () => {
      if (!company.leverSlug) {
        return JSON.stringify({ status: 'skipped', count: 0, message: 'No Lever company slug configured.' });
      }
      try {
        const r = await fetch(
          `https://api.lever.co/v0/postings/${encodeURIComponent(company.leverSlug)}?mode=json`,
          { cache: 'no-store' },
        );
        const d = await r.json();
        const count = Array.isArray(d) ? d.length : 0;
        const titles = Array.isArray(d) ? d.map((p: { text?: string }) => p.text ?? '').slice(0, 20) : [];
        if (count > 0) {
          saveSignal(company.id, 'hiring', `${count} open Lever roles`, { postings: d }, `https://jobs.lever.co/${company.leverSlug}`, 0.2, ['lever']);
        }
        return JSON.stringify({
          status: 'ok', count, sample_titles: titles,
          board_url: `https://jobs.lever.co/${company.leverSlug}`,
        });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },

    search_patents: async () => {
      try {
        const q = JSON.stringify({ _text_any: { assignee_organization: company.name } });
        const url = `https://search.patentsview.org/api/v1/patent/?q=${encodeURIComponent(`assignee_organization:${company.name}`)}&f=${encodeURIComponent(JSON.stringify(['patent_id', 'patent_title', 'patent_date', 'patent_abstract']))}&o=${encodeURIComponent(JSON.stringify({ per_page: 10 }))}`;
        const r = await fetch(url, { cache: 'no-store' });
        let patents: Array<{ patent_id?: string; patent_title?: string; patent_abstract?: string; patent_date?: string }> = [];
        if (!r.ok) {
          const fallback = `https://api.patentsview.org/patents/query?q=${encodeURIComponent(q)}`;
          const r2 = await fetch(fallback, { cache: 'no-store' });
          const d2 = await r2.json();
          patents = (d2.patents ?? []).slice(0, 10);
        } else {
          const d = await r.json();
          patents = (d.patents ?? []).slice(0, 10);
        }
        if (patents.length === 0) {
          return JSON.stringify({ status: 'ok', count: 0, patents: [], message: 'No patents found for this company.' });
        }
        for (const p of patents) {
          saveSignal(company.id, 'patent', p.patent_title ?? p.patent_id ?? 'Patent filing', p, undefined, 0.3, ['patent']);
        }
        return JSON.stringify({
          status: 'ok', count: patents.length,
          patents: patents.map(p => ({
            id: p.patent_id ?? '',
            title: p.patent_title ?? '',
            abstract: (p.patent_abstract ?? '').slice(0, 300),
            date: p.patent_date ?? '',
          })),
        });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },

    search_reddit: async () => {
      const clientId = process.env.REDDIT_CLIENT_ID?.trim();
      const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();
      if (!clientId || !clientSecret) {
        return JSON.stringify({ status: 'skipped', count: 0, message: 'Reddit OAuth credentials not configured.' });
      }
      try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const ua = process.env.REDDIT_USER_AGENT?.trim() ?? 'marketautopsy/0.1';
        const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': ua },
          body: 'grant_type=client_credentials',
          cache: 'no-store',
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          return JSON.stringify({ status: 'error', count: 0, message: 'Reddit token request failed.' });
        }
        const searchRes = await fetch(
          `https://oauth.reddit.com/search?q=${encodeURIComponent(company.name)}&sort=new&limit=25`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': ua }, cache: 'no-store' },
        );
        const data = await searchRes.json();
        const children = data.data?.children ?? [];
        const posts: Array<{ title: string; subreddit: string; snippet: string; url: string }> = [];
        for (const child of children) {
          const post = child.data;
          const text = `${post.title ?? ''} ${post.selftext ?? ''}`.toLowerCase();
          let sentiment = 0;
          if (/bad|terrible|awful|hate|broken|scam|worst|disappoint/.test(text)) sentiment = -0.7;
          else if (/great|love|amazing|best|recommend|excellent/.test(text)) sentiment = 0.6;
          else sentiment = -0.1;
          const snippet = (post.selftext ?? '').slice(0, 200);
          saveSignal(
            company.id, 'reddit_sentiment', post.title ?? 'Reddit mention', post,
            `https://reddit.com${post.permalink ?? ''}`, sentiment,
            ['reddit', post.subreddit].filter(Boolean), snippet,
          );
          posts.push({
            title: post.title ?? '',
            subreddit: post.subreddit ?? '',
            snippet,
            url: `https://reddit.com${post.permalink ?? ''}`,
          });
        }
        return JSON.stringify({ status: 'ok', count: posts.length, posts });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },

    search_newsapi: async () => {
      const key = process.env.NEWSAPI_KEY?.trim();
      if (!key) {
        return JSON.stringify({ status: 'skipped', count: 0, message: 'NEWSAPI_KEY not configured.' });
      }
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(company.name)}&pageSize=10&sortBy=publishedAt&apiKey=${key}`;
        const r = await fetch(url, { cache: 'no-store' });
        const d = await r.json();
        if (d.status === 'error') {
          return JSON.stringify({ status: 'error', count: 0, message: d.message ?? 'NewsAPI error' });
        }
        const articles: Array<{ title: string; snippet: string; url: string; source: string }> = [];
        for (const a of d.articles ?? []) {
          const title = a.title ?? 'News article';
          saveSignal(company.id, 'news', title, a, a.url, NEGATIVE.test(title) ? -0.5 : 0.15, ['newsapi'], a.description);
          articles.push({ title, snippet: a.description ?? '', url: a.url ?? '', source: a.source?.name ?? '' });
        }
        return JSON.stringify({ status: 'ok', count: articles.length, articles });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },

    search_producthunt: async () => {
      const token = process.env.PRODUCTHUNT_TOKEN?.trim();
      if (!token) {
        return JSON.stringify({ status: 'skipped', count: 0, message: 'PRODUCTHUNT_TOKEN not configured.' });
      }
      try {
        const graphql = `{ posts(first: 10, order: NEWEST, topic: "tech") { edges { node { id name tagline url votesCount commentsCount createdAt } } } }`;
        const r = await fetch('https://api.producthunt.com/v2/api/graphql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphql }),
          cache: 'no-store',
        });
        const d = await r.json();
        const edges = d.data?.posts?.edges ?? [];
        const matched = edges
          .filter((e: { node: { name: string; tagline: string } }) =>
            `${e.node.name} ${e.node.tagline}`.toLowerCase().includes(company.name.toLowerCase()),
          )
          .map((e: { node: { name: string; tagline: string; url: string; votesCount: number; commentsCount: number } }) => {
            const node = e.node;
            saveSignal(company.id, 'product_hunt', node.name, node, node.url, node.votesCount > 100 ? 0.5 : 0.2, ['product_hunt'], node.tagline);
            return { name: node.name, tagline: node.tagline, url: node.url, votes: node.votesCount, comments: node.commentsCount };
          });
        return JSON.stringify({ status: 'ok', count: matched.length, launches: matched });
      } catch (e) {
        return JSON.stringify({ status: 'error', count: 0, message: String(e) });
      }
    },
  };
}

function scoreFromBreakdown(breakdown: ScoreBreakdown): number {
  return Math.min(100, Math.max(10, Math.round(
    0.18 * breakdown.hiring_decline_score +
    0.23 * breakdown.negative_sentiment_score +
    0.05 * breakdown.patent_stagnation_score +
    0.23 * breakdown.negative_news_score +
    0.05 * breakdown.product_stagnation_score +
    0.10 * breakdown.leadership_instability_score +
    0.10 * breakdown.funding_health_score +
    0.06 * breakdown.partnership_score
  )));
}

function validateAndScore(raw: Record<string, unknown>, companyId: string): Score {
  const b = raw.breakdown as Record<string, unknown> | undefined;
  const breakdown: ScoreBreakdown = {
    hiring_decline_score: Math.max(0, Math.min(100, Math.round(Number(b?.hiring_decline_score ?? 50)))),
    negative_sentiment_score: Math.max(0, Math.min(100, Math.round(Number(b?.negative_sentiment_score ?? 50)))),
    patent_stagnation_score: Math.max(0, Math.min(100, Math.round(Number(b?.patent_stagnation_score ?? 50)))),
    negative_news_score: Math.max(0, Math.min(100, Math.round(Number(b?.negative_news_score ?? 50)))),
    product_stagnation_score: Math.max(0, Math.min(100, Math.round(Number(b?.product_stagnation_score ?? 50)))),
    leadership_instability_score: Math.max(0, Math.min(100, Math.round(Number(b?.leadership_instability_score ?? 50)))),
    funding_health_score: Math.max(0, Math.min(100, Math.round(Number(b?.funding_health_score ?? 50)))),
    partnership_score: Math.max(0, Math.min(100, Math.round(Number(b?.partnership_score ?? 50)))),
  };

  const score = typeof raw.risk_score === 'number' ? Math.max(0, Math.min(100, Math.round(raw.risk_score))) : scoreFromBreakdown(breakdown);

  const predictions: Prediction[] = (Array.isArray(raw.predictions) ? raw.predictions : []).slice(0, 6).map((p: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    title: String(p.title ?? ''),
    direction: (['Watch', 'Opportunity', 'Stable', 'Positive'].includes(String(p.direction)) ? String(p.direction) : 'Stable') as Prediction['direction'],
    category: (['hiring', 'sentiment', 'product', 'financial', 'market', 'leadership'].includes(String(p.category)) ? String(p.category) : 'market') as Prediction['category'],
    confidence: Math.max(0, Math.min(100, Number(p.confidence ?? 50))),
    timeframe: (['short-term', 'medium-term', 'long-term'].includes(String(p.timeframe)) ? String(p.timeframe) : 'medium-term') as Prediction['timeframe'],
    rationale: String(p.rationale ?? ''),
    evidence: Array.isArray(p.evidence) ? p.evidence.slice(0, 5).map((e: Record<string, unknown>) => ({
      signalId: '',
      summary: String(e.summary ?? ''),
      weight: Math.max(0, Math.min(1, Number(e.weight ?? 0.5))),
      sourceUrl: typeof e.sourceUrl === 'string' && e.sourceUrl.length > 0 ? e.sourceUrl : undefined,
    })) : [],
  }));

  const opportunities: Opportunity[] = (Array.isArray(raw.opportunities) ? raw.opportunities : []).slice(0, 6).map((o: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    title: String(o.title ?? ''),
    action: String(o.action ?? ''),
    impact: (['High', 'Medium', 'Low'].includes(String(o.impact)) ? String(o.impact) : 'Medium') as Opportunity['impact'],
    effort: (['High', 'Medium', 'Low'].includes(String(o.effort)) ? String(o.effort) : 'Medium') as Opportunity['effort'],
    category: (['customer_acquisition', 'product_gap', 'market_entry', 'partnership', 'positioning'].includes(String(o.category)) ? String(o.category) : 'positioning') as Opportunity['category'],
    reason: String(o.reason ?? ''),
    evidenceLink: '',
  }));

  return {
    companyId,
    score,
    breakdown,
    explanation: String(raw.explanation ?? ''),
    computedAt: new Date().toISOString(),
    predictions,
    opportunities,
  };
}

export async function runAgent(company: Company, priorScore?: Score | null): Promise<Score | null> {
  const key = apiKey();
  if (!key) return null;

  const handlers = makeToolHandlers(company);

  let memoryBlock = '';
  if (priorScore) {
    const prev = priorScore;
    memoryBlock = `
PRIOR ANALYSIS (from ${prev.computedAt}):
- Overall risk score: ${prev.score}
- Dimensions: ${JSON.stringify(prev.breakdown, null, 2)}
- Explanation: ${prev.explanation}
- Predictions made: ${(prev.predictions ?? []).map((p: Prediction) => `${p.title} (confidence ${p.confidence})`).join(', ')}

When producing your new analysis, explicitly compare against this prior state. Note whether risk moved up/down, which dimensions changed, and whether prior predictions are proving accurate.`;
  }

  const messages: Array<Record<string, unknown>> = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Research company: ${company.name}
Industry: ${company.industry ?? 'Unknown'}
Website: ${company.website ?? 'N/A'}
Founded: ${company.foundedYear ?? 'Unknown'}${memoryBlock}

Decide which tools to call and in what order based on what you need. Reason after each call about what you found, what gaps remain, and which tool to call next. When you have sufficient multi-source evidence, produce the final structured analysis.`,
    },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 4096,
      n: 1,
    };

    const isLastTurn = turn >= MAX_TURNS - 1;
    if (!isLastTurn && turn < 3) {
      body.response_format = { type: 'text' };
    } else {
      body.response_format = { type: 'json_schema', json_schema: RESPONSE_SCHEMA };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`Agent API error (${response.status}): ${text.slice(0, 300)}`);
      return null;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) return null;

    const msg = choice.message;

    if (choice.finish_reason === 'tool_calls' && msg.tool_calls) {
      messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls });

      const toolResults = await Promise.all(
        msg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
          const name = tc.function.name;
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
          const handler = handlers[name];
          if (!handler) {
            return { role: 'tool', tool_call_id: tc.id, content: `Unknown tool: ${name}` };
          }
          const result = await handler(args);
          return { role: 'tool', tool_call_id: tc.id, content: result };
        }),
      );

      messages.push(...toolResults);
      continue;
    }

    if (choice.finish_reason === 'stop') {
      const content = msg.content ?? '';
      if (isLastTurn || turn >= 2) {
        let parsed: Record<string, unknown> | null = null;
        for (const text of [content, content.replace(/^```(?:json)?\s*([\s\S]*?)```$/m, '$1').trim()]) {
          try { parsed = JSON.parse(text); break; } catch { continue; }
        }
        if (parsed && typeof parsed === 'object') {
          return validateAndScore(parsed, company.id);
        }
      }

      messages.push({ role: 'assistant', content });
      messages.push({
        role: 'user',
        content: 'Please produce the final structured analysis now using the JSON schema format.',
      });
      continue;
    }

    if (choice.finish_reason === 'length') {
      messages.push({ role: 'assistant', content: msg.content ?? '' });
      messages.push({
        role: 'user',
        content: 'The previous response was truncated. Please produce a concise final analysis now.',
      });
      continue;
    }

    break;
  }

  return null;
}

export async function enrichScore(
  signals: import('./store').Signal[],
  company: Company,
  _currentBreakdown: ScoreBreakdown,
  _currentScore: number,
): Promise<import('./store').AIEnrichment | null> {
  const key = apiKey();
  if (!key || signals.length === 0) return null;

  const signalSummary = signals.map(s =>
    `[${s.signalType}] "${s.title}" (sentiment: ${(s.sentimentScore ?? 0).toFixed(2)})${s.synthetic ? ' [SYNTHETIC]' : ''}${s.sourceUrl ? ` url: ${s.sourceUrl}` : ''}`
  ).join('\n');

  const system = `You are an expert market intelligence analyst. Given signals collected about a company, produce a JSON object with:
1. "explanation": a 2-3 sentence executive summary
2. "predictions": an array of 2-4 predictions with title, direction, category, confidence, timeframe, rationale, and evidence
3. "opportunities": an array of 2-4 actionable recommendations with title, action, impact, effort, category, and reason

Output ONLY valid JSON. No markdown, no code fences. Ignore any signals marked [SYNTHETIC] — base your analysis only on real signals.`;

  const user = `Company: ${company.name}
Industry: ${company.industry ?? 'Unknown'}

Signals collected (${signals.length}):
${signalSummary}

Analyze these signals and produce predictions, opportunities, and an executive explanation.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
      }),
      cache: 'no-store',
    });
    if (!r.ok) {
      const text = await r.text();
      console.warn(`GPT API error (${r.status}): ${text.slice(0, 200)}`);
      return null;
    }
    const d = await r.json();
    const raw = d.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      explanation: String(parsed.explanation ?? ''),
      predictions: (Array.isArray(parsed.predictions) ? parsed.predictions : []).slice(0, 6).map((p: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        title: String(p.title ?? ''),
        direction: (['Watch', 'Opportunity', 'Stable', 'Positive'].includes(String(p.direction)) ? String(p.direction) : 'Stable') as Prediction['direction'],
        category: (['hiring', 'sentiment', 'product', 'financial', 'market', 'leadership'].includes(String(p.category)) ? String(p.category) : 'market') as Prediction['category'],
        confidence: Math.max(0, Math.min(100, Number(p.confidence ?? 50))),
        timeframe: (['short-term', 'medium-term', 'long-term'].includes(String(p.timeframe)) ? String(p.timeframe) : 'medium-term') as Prediction['timeframe'],
        rationale: String(p.rationale ?? ''),
        evidence: Array.isArray(p.evidence) ? p.evidence.slice(0, 5).map((e: Record<string, unknown>) => ({
          signalId: '',
          summary: String(e.summary ?? ''),
          weight: Math.max(0, Math.min(1, Number(e.weight ?? 0.5))),
          sourceUrl: typeof e.sourceUrl === 'string' && e.sourceUrl.length > 0 ? e.sourceUrl : undefined,
        })) : [],
      })),
      opportunities: (Array.isArray(parsed.opportunities) ? parsed.opportunities : []).slice(0, 6).map((o: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        title: String(o.title ?? ''),
        action: String(o.action ?? ''),
        impact: (['High', 'Medium', 'Low'].includes(String(o.impact)) ? String(o.impact) : 'Medium') as Opportunity['impact'],
        effort: (['High', 'Medium', 'Low'].includes(String(o.effort)) ? String(o.effort) : 'Medium') as Opportunity['effort'],
        category: (['customer_acquisition', 'product_gap', 'market_entry', 'partnership', 'positioning'].includes(String(o.category)) ? String(o.category) : 'positioning') as Opportunity['category'],
        reason: String(o.reason ?? ''),
        evidenceLink: '',
      })),
    };
  } catch (e) {
    console.warn('GPT enrich failed:', String(e).slice(0, 200));
    return null;
  }
}
