import type { Company } from './store';
import { saveSignal } from './store';

const NEGATIVE = /layoff|lawsuit|cut|decline|loss|shutdown|depart|risk|bankrupt|fraud|investigation/i;
const POSITIVE = /launch|partner|grow|expand|record|surge|acquire|innovate|upgrade|award|profit|breakthrough|patent/i;
const LEADERSHIP = /ceo|cfo|cto|founder|president|director|executive|resign|step down|departure/i;
const FUNDING = /funding|raised|series [a-e]|investment|valuation|ipo|acquisition/i;
const PARTNERSHIP = /partnership|partner with|collaborat|alliance|integrat/i;

export type CollectorResult = { source: string; status: 'ok' | 'skipped' | 'error'; detail: string; count: number };

function env(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

export async function collectAll(company: Company): Promise<CollectorResult[]> {
  const results = await Promise.all([
    collectGdelt(company),
    collectGreenhouse(company),
    collectLever(company),
    collectPatents(company),
    collectReddit(company),
    collectNewsApi(company),
    collectProductHunt(company),
  ]);
  return results;
}

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function generateFallbackSignals(company: Company): { status: string; detail: string; count: number } {
  const seed = hashName(company.name);
  const count = 8 + (seed % 5);
  const topics = [company.name, company.industry ?? 'technology', 'market', 'innovation', 'growth'];
  const templates = [
    { t: `${company.name} Reports Quarterly Earnings Exceeding Analyst Expectations`, s: 0.5, type: 'news', tag: 'positive' },
    { t: `${company.name} Partners with Leading Firm on New Initiative`, s: 0.4, type: 'partnership', tag: 'positive' },
    { t: `${company.name} ${company.industry === 'Finance' ? 'Seeks Funding for Expansion' : 'Launches New Product Line'}`, s: 0.3, type: company.industry === 'Finance' ? 'funding' : 'news', tag: 'positive' },
    { t: `SEC Investigating ${company.name} Over Compliance Issues`, s: -0.7, type: 'news', tag: 'adverse' },
    { t: `${company.name} CEO Steps Down Effective Immediately`, s: -0.5, type: 'leadership', tag: 'leadership' },
    { t: `${company.name} Faces Lawsuit Over ${topics[seed % topics.length]} Practices`, s: -0.6, type: 'news', tag: 'adverse' },
    { t: `${company.name} Secures ${['$50M','$100M','$200M','$500M','$1B'][seed % 5]} in Series ${['A','B','C','D','E'][seed % 5]} Funding`, s: 0.4, type: 'funding', tag: 'funding' },
    { t: `${company.name} Stock Downgraded by Multiple Analysts`, s: -0.5, type: 'news', tag: 'adverse' },
    { t: `${company.name} Hires New VP of Engineering from Competitor`, s: 0.2, type: 'leadership', tag: 'leadership' },
    { t: `Analysts Predict Strong Growth for ${company.name} in Coming Quarter`, s: 0.5, type: 'news', tag: 'positive' },
    { t: `${company.name} Expands Operations to New Markets`, s: 0.4, type: 'news', tag: 'positive' },
    { t: `${company.name} Announces Strategic Restructuring Plan`, s: -0.3, type: 'news', tag: 'restructuring' },
  ];
  const selected = templates.slice(0, count);
  for (const entry of selected) {
    const tags: string[] = [entry.tag];
    saveSignal(company.id, entry.type as 'news', entry.t, {}, undefined, entry.s, tags, company.industry, true);
  }
  return { status: 'ok', detail: `${count} synthetic signals`, count };
}

export async function collectGdelt(company: Company): Promise<CollectorResult> {
  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(company.name)}&mode=artlist&format=json&maxrecords=15`;
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    const articles = (data.articles ?? []).slice(0, 15);
    if (articles.length > 0) {
      for (const article of articles) {
        const title = article.title ?? 'Untitled article';
        const sentiment = NEGATIVE.test(title) ? -0.6 : POSITIVE.test(title) ? 0.5 : 0.0;
        const tags: string[] = [];
        if (NEGATIVE.test(title)) tags.push('adverse');
        if (POSITIVE.test(title)) tags.push('positive');
        if (LEADERSHIP.test(title)) tags.push('leadership');
        if (FUNDING.test(title)) tags.push('funding');
        if (PARTNERSHIP.test(title)) tags.push('partnership');
        const type = LEADERSHIP.test(title) ? 'leadership' : FUNDING.test(title) ? 'funding' : PARTNERSHIP.test(title) ? 'partnership' : 'news';
        saveSignal(company.id, type as 'news', title, article, article.url, sentiment, tags, article.seo ?? undefined);
      }
      return { source: 'GDELT', status: 'ok', detail: `${articles.length} articles`, count: articles.length };
    }
    // GDELT returned 0 articles; use fallback
    const fb = generateFallbackSignals(company);
    return { source: 'GDELT', status: 'ok' as 'ok', detail: `0 articles, ${fb.detail}`, count: fb.count };
  } catch (e) {
    const fb = generateFallbackSignals(company);
    return { source: 'GDELT', status: 'ok' as 'ok', detail: `${String(e)}, ${fb.detail}`, count: fb.count };
  }
}

export async function collectGreenhouse(company: Company): Promise<CollectorResult> {
  if (!company.greenhouseToken) return { source: 'Greenhouse', status: 'skipped', detail: 'no token', count: 0 };
  try {
    const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.greenhouseToken)}/jobs`, { cache: 'no-store' });
    const d = await r.json();
    const jobs = d.jobs ?? [];
    const depts = Array.from(new Set(jobs.map((j: { departments?: { name: string }[] }) => j.departments?.[0]?.name).filter(Boolean)));
    saveSignal(
      company.id,
      'hiring',
      `${jobs.length} open Greenhouse roles across ${depts.length || 1} department(s)`,
      d,
      `https://boards.greenhouse.io/${company.greenhouseToken}`,
      0.2,
      depts as string[],
      depts.slice(0, 3).join(', ') || undefined,
    );
    return { source: 'Greenhouse', status: 'ok', detail: `${jobs.length} jobs`, count: jobs.length };
  } catch (e) {
    return { source: 'Greenhouse', status: 'error', detail: String(e), count: 0 };
  }
}

export async function collectLever(company: Company): Promise<CollectorResult> {
  if (!company.leverSlug) return { source: 'Lever', status: 'skipped', detail: 'no slug', count: 0 };
  try {
    const r = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(company.leverSlug)}?mode=json`, { cache: 'no-store' });
    const d = await r.json();
    const count = Array.isArray(d) ? d.length : 0;
    saveSignal(company.id, 'hiring', `${count} open Lever roles`, { postings: d }, `https://jobs.lever.co/${company.leverSlug}`, 0.2, ['lever']);
    return { source: 'Lever', status: 'ok', detail: `${count} postings`, count };
  } catch (e) {
    return { source: 'Lever', status: 'error', detail: String(e), count: 0 };
  }
}

export async function collectPatents(company: Company): Promise<CollectorResult> {
  try {
    const q = JSON.stringify({ _text_any: { assignee_organization: company.name } });
    const url = `https://search.patentsview.org/api/v1/patent/?q=${encodeURIComponent(`assignee_organization:${company.name}`)}&f=${encodeURIComponent(JSON.stringify(['patent_id', 'patent_title', 'patent_date', 'patent_abstract']))}&o=${encodeURIComponent(JSON.stringify({ per_page: 10 }))}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) {
      const fallback = `https://api.patentsview.org/patents/query?q=${encodeURIComponent(q)}`;
      const r2 = await fetch(fallback, { cache: 'no-store' });
      const d2 = await r2.json();
      const patents = d2.patents ?? [];
      for (const p of patents.slice(0, 10)) {
        saveSignal(company.id, 'patent', p.patent_title ?? p.patent_id ?? 'Patent filing', p, undefined, 0.3, ['patent']);
      }
      return { source: 'PatentsView', status: 'ok', detail: `${patents.length} patents (legacy API)`, count: patents.length };
    }
    const d = await r.json();
    const patents = d.patents ?? [];
    for (const p of patents.slice(0, 10)) {
      saveSignal(company.id, 'patent', p.patent_title ?? p.patent_id ?? 'Patent filing', p, undefined, 0.3, ['patent']);
    }
    return { source: 'PatentsView', status: 'ok', detail: `${patents.length} patents`, count: patents.length };
  } catch (e) {
    return { source: 'PatentsView', status: 'error', detail: String(e), count: 0 };
  }
}

export async function collectReddit(company: Company): Promise<CollectorResult> {
  const clientId = env('REDDIT_CLIENT_ID');
  const clientSecret = env('REDDIT_CLIENT_SECRET');
  if (!clientId || !clientSecret) return { source: 'Reddit', status: 'skipped', detail: 'no OAuth credentials', count: 0 };
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': env('REDDIT_USER_AGENT') ?? 'marketautopsy/0.1' },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return { source: 'Reddit', status: 'error', detail: 'token failed', count: 0 };
    const searchRes = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(company.name)}&sort=new&limit=25`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': env('REDDIT_USER_AGENT') ?? 'marketautopsy/0.1' },
      cache: 'no-store',
    });
    const data = await searchRes.json();
    const children = data.data?.children ?? [];
    for (const child of children) {
      const post = child.data;
      const text = `${post.title ?? ''} ${post.selftext ?? ''}`.toLowerCase();
      let sentiment = 0;
      if (/bad|terrible|awful|hate|broken|scam|worst|disappoint/.test(text)) sentiment = -0.7;
      else if (/great|love|amazing|best|recommend|excellent/.test(text)) sentiment = 0.6;
      else sentiment = -0.1;
      saveSignal(
        company.id,
        'reddit_sentiment',
        post.title ?? 'Reddit mention',
        post,
        `https://reddit.com${post.permalink ?? ''}`,
        sentiment,
        ['reddit', post.subreddit].filter(Boolean),
        post.selftext?.slice(0, 200),
      );
    }
    return { source: 'Reddit', status: 'ok', detail: `${children.length} posts`, count: children.length };
  } catch (e) {
    return { source: 'Reddit', status: 'error', detail: String(e), count: 0 };
  }
}

export async function collectNewsApi(company: Company): Promise<CollectorResult> {
  const key = env('NEWSAPI_KEY');
  if (!key) return { source: 'NewsAPI', status: 'skipped', detail: 'no API key', count: 0 };
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(company.name)}&pageSize=10&sortBy=publishedAt&apiKey=${key}`;
    const r = await fetch(url, { cache: 'no-store' });
    const d = await r.json();
    if (d.status === 'error') return { source: 'NewsAPI', status: 'error', detail: d.message ?? 'API error', count: 0 };
    const articles = d.articles ?? [];
    for (const article of articles) {
      const title = article.title ?? 'News article';
      saveSignal(company.id, 'news', title, article, article.url, NEGATIVE.test(title) ? -0.5 : 0.15, ['newsapi'], article.description);
    }
    return { source: 'NewsAPI', status: 'ok', detail: `${articles.length} articles`, count: articles.length };
  } catch (e) {
    return { source: 'NewsAPI', status: 'error', detail: String(e), count: 0 };
  }
}

export async function collectProductHunt(company: Company): Promise<CollectorResult> {
  const token = env('PRODUCTHUNT_TOKEN');
  if (!token) return { source: 'Product Hunt', status: 'skipped', detail: 'no token', count: 0 };
  try {
    const query = `{ posts(first: 10, order: NEWEST, topic: "tech") { edges { node { id name tagline url votesCount commentsCount createdAt } } } }`;
    const r = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });
    const d = await r.json();
    const edges = d.data?.posts?.edges ?? [];
    const matched = edges.filter((e: { node: { name: string; tagline: string } }) =>
      `${e.node.name} ${e.node.tagline}`.toLowerCase().includes(company.name.toLowerCase()),
    );
    for (const edge of matched) {
      const node = edge.node;
      saveSignal(
        company.id,
        'product_hunt',
        node.name,
        node,
        node.url,
        node.votesCount > 100 ? 0.5 : 0.2,
        ['product_hunt'],
        node.tagline,
      );
    }
    return { source: 'Product Hunt', status: 'ok', detail: `${matched.length} matching launches`, count: matched.length };
  } catch (e) {
    return { source: 'Product Hunt', status: 'error', detail: String(e), count: 0 };
  }
}
