'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, TrendingUp, TrendingDown, Minus, Activity, BarChart3, AlertTriangle, Layers, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DarkTopNav } from '@/components/ui/DarkTopNav';

type ScoreData = {
  score: number; computedAt: string; breakdown: Record<string, number>;
  explanation: string; predictions: any[]; opportunities: any[];
  _prev?: number;
};

type CompanyData = {
  id: string; name: string; industry?: string; score?: ScoreData;
  signalCount: number; timelineEvents: number;
};

function TrendIcon({ current, previous }: { current?: number; previous?: number }) {
  if (previous === undefined || current === undefined) return <Minus size={14} className="text-on-surface-variant/60" />;
  if (current > previous + 5) return <TrendingUp size={14} className="text-red-500" />;
  if (current < previous - 5) return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-on-surface-variant/60" />;
}

export default function Dashboard() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const oldById = useRef<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'signals'>('risk');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then((data: CompanyData[]) => {
      const next: Record<string, number> = {};
      data.forEach(c => { if (c.score) next[c.id] = c.score.score; });
      data.forEach(c => {
        if (c.score && oldById.current[c.id] !== undefined && oldById.current[c.id] !== c.score.score) {
          c.score._prev = oldById.current[c.id];
        }
      });
      setCompanies(data);
      oldById.current = next;
    });
  }, []);

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const ranked = [...filtered].sort((a, b) => {
    if (sortBy === 'risk') return (b.score?.score ?? 0) - (a.score?.score ?? 0);
    if (sortBy === 'signals') return (b.signalCount ?? 0) - (a.signalCount ?? 0);
    return a.name.localeCompare(b.name);
  });

  const withScores = ranked.filter(x => x.score);
  const avgRisk = withScores.length ? Math.round(withScores.reduce((s, x) => s + x.score!.score, 0) / withScores.length) : 0;
  const maxRisk = withScores.length ? Math.max(...withScores.map(x => x.score!.score)) : 0;

  return (
    <div className="dark-page bg-background text-on-surface min-h-screen">
      <DarkTopNav />
      <div className="max-w-[1200px] mx-auto px-6" style={{ paddingTop: 96, paddingBottom: 80 }}>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase">Competitor comparison</div>
            <h1 className="text-[36px] font-[800] tracking-[-.05em] my-2 text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>Market command center</h1>
            <p className="text-on-surface-variant max-w-[560px] text-[16px] leading-[1.6]">Track and compare market health across companies. Run AI research on any company to generate evidence-backed risk scores and opportunities.</p>
          </div>
          <Link className="inline-flex items-center gap-2 px-4 py-3 rounded-[10px] font-semibold bg-primary text-on-primary hover:opacity-90 transition-all" href="/add"><Plus size={16} /> Add company</Link>
        </div>

        {withScores.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 mt-6 rounded-xl"
          >
            <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase">Portfolio overview</div>
            <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div>
                <div className="font-mono text-[28px] font-semibold text-on-surface">{companies.length}</div>
                <span className="text-on-surface-variant text-[12px]">Companies tracked</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold" style={{ color: avgRisk > 35 ? '#eab308' : '#16a34a' }}>{avgRisk}</div>
                <span className="text-on-surface-variant text-[12px]">Average risk score</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold" style={{ color: maxRisk > 60 ? '#ef4444' : '#eab308' }}>{maxRisk}</div>
                <span className="text-on-surface-variant text-[12px]">Highest risk</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold text-on-surface">
                  {withScores.filter(x => x.score!.score > 60).length}
                  <span className="text-[16px] text-red-500"> / {withScores.filter(x => x.score!.score > 35).length}</span>
                </div>
                <span className="text-on-surface-variant text-[12px]">High / medium risk</span>
              </div>
            </div>
          </motion.section>
        )}

        <div className="flex gap-3 mt-6 flex-wrap items-center">
          <input
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-[10px] bg-surface-container-low border border-white/10 text-on-surface outline-none text-[14px] focus:border-primary/40 focus:bg-surface-container transition-all"
          />
          <div className="flex gap-1.5 items-center">
            <span className="text-on-surface-variant text-[12px]">Sort by:</span>
            {(['risk', 'name', 'signals'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className="px-3 py-1.5 text-[12px] rounded-[10px] border font-medium transition-all"
                style={{ borderColor: sortBy === s ? 'var(--d-accent, #7c5cfc)' : 'rgba(255,255,255,0.08)', background: sortBy === s ? 'rgba(124,92,252,0.1)' : 'transparent', color: sortBy === s ? 'var(--d-accent, #7c5cfc)' : 'var(--d-muted, rgba(240,240,245,0.45))' }}>
                {s === 'risk' ? 'Risk' : s === 'name' ? 'Name' : 'Signals'}
              </button>
            ))}
          </div>
        </div>

        <section className="grid gap-4 mt-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {ranked.length > 0 ? ranked.map((x, i) => (
            <motion.div key={x.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.35 }} className="relative">
              <Link href={`/company/${x.id}`} className="glass-panel p-5 rounded-xl block group hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[11px] text-on-surface-variant">MARKET HEALTH</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{x.industry || 'Technology'}</span>
                    {x.signalCount > 0 && <span className="font-mono text-[10px] text-on-surface-variant">{x.signalCount} signals</span>}
                  </div>
                </div>
                <div className="flex items-end gap-3 mt-3">
                  <div className="font-mono text-[42px] font-bold tracking-[-.08em] leading-none" style={{ color: x.score ? (x.score.score > 60 ? '#ef4444' : x.score.score > 35 ? '#eab308' : '#22c55e') : 'var(--d-muted)' }}>
                    {x.score?.score ?? '—'}
                  </div>
                  <div className="mb-1.5">
                    <TrendIcon current={x.score?.score} previous={x.score?._prev} />
                  </div>
                </div>
                <div className="flex justify-between gap-3 items-center mt-3">
                  <strong className="text-[16px] text-on-surface">{x.name}</strong>
                  <ArrowUpRight size={16} className="text-primary flex-shrink-0" />
                </div>
                {x.score ? (
                  <p className="text-on-surface-variant text-[11px] mt-2 mb-0">
                    Evidence updated {new Date(x.score.computedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-on-surface-variant text-[11px] mt-2 mb-0">
                    Research has not run yet. Click to analyze.
                  </p>
                )}
              </Link>
              <button onClick={async () => {
                if (!confirm(`Remove ${x.name} from your watchlist?`)) return;
                await fetch(`/api/companies/${x.id}`, { method: 'DELETE' });
                setCompanies(prev => prev.filter(c => c.id !== x.id));
              }} className="absolute top-2 right-2 bg-transparent border-none cursor-pointer p-1 text-on-surface-variant/40 hover:text-on-surface-variant transition-all" title="Remove company">
                <Trash2 size={14} />
              </button>
            </motion.div>
          )) : (
            <div className="glass-panel p-8 rounded-xl text-center col-span-full">
              <Activity size={32} className="text-on-surface-variant mx-auto mb-3" />
              <h3 className="text-on-surface text-lg font-semibold">No companies in your watchlist</h3>
              <p className="text-on-surface-variant mb-4 text-[14px]">
                Add companies to start tracking their market health signals and AI-generated predictions.
              </p>
              <Link href="/add" className="inline-flex items-center gap-2 px-4 py-3 rounded-[10px] font-semibold bg-primary text-on-primary">
                <Plus size={16} /> Add your first company
              </Link>
            </div>
          )}
        </section>

        {withScores.length > 1 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel mt-8 overflow-x-auto p-6 rounded-xl">
            <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase mb-4 flex items-center gap-1">
              <BarChart3 size={13} /> Side-by-side evidence comparison
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left p-3 pl-0 font-semibold text-on-surface">Company</th>
                  <th className="text-center font-semibold text-on-surface">Health</th>
                  <th className="text-center font-semibold text-on-surface">Hiring</th>
                  <th className="text-center font-semibold text-on-surface">Sentiment</th>
                  <th className="text-center font-semibold text-on-surface">Patents</th>
                  <th className="text-center font-semibold text-on-surface">News</th>
                  <th className="text-center font-semibold text-on-surface">Product</th>
                  <th className="text-center font-semibold text-on-surface">Leadership</th>
                  <th className="text-center font-semibold text-on-surface">Partnership</th>
                  <th className="text-right p-3 pr-0 font-semibold text-on-surface">Signals</th>
                </tr>
              </thead>
              <tbody>
                {withScores.sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0)).map(x => (
                  <tr key={x.id} className="border-t border-white/5">
                    <td className="p-3 pl-0"><Link href={`/company/${x.id}`} className="font-semibold text-primary hover:underline">{x.name}</Link></td>
                    <td className="text-center font-mono font-semibold" style={{ color: x.score!.score > 60 ? '#ef4444' : x.score!.score > 35 ? '#eab308' : '#22c55e' }}>{x.score!.score}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.hiring_decline_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.negative_sentiment_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.patent_stagnation_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.negative_news_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.product_stagnation_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.leadership_instability_score ?? '-'}</td>
                    <td className="text-center font-mono text-on-surface-variant">{x.score!.breakdown.partnership_score ?? '-'}</td>
                    <td className="text-right p-3 pr-0 font-mono text-on-surface-variant">{x.signalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-on-surface-variant text-[11px] mt-3">Scores are 0-100; higher means more cause for attention. Missing sources contribute &ldquo;no data&rdquo;, not negative evidence.</div>
          </motion.section>
        )}

        {withScores.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel mt-8 p-6 rounded-xl">
            <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase mb-4 flex items-center gap-1">
              <Layers size={13} /> Industry heatmap
            </div>
            {(() => {
              const groups: Record<string, CompanyData[]> = {};
              withScores.forEach(x => { const ind = x.industry || 'Technology'; (groups[ind] ??= []).push(x); });
              return (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {Object.entries(groups).sort((a, b) => {
                    const avgA = a[1].reduce((s, x) => s + x.score!.score, 0) / a[1].length;
                    const avgB = b[1].reduce((s, x) => s + x.score!.score, 0) / b[1].length;
                    return avgB - avgA;
                  }).map(([industry, comps]) => {
                    const avg = Math.round(comps.reduce((s, x) => s + x.score!.score, 0) / comps.length);
                    const max = Math.max(...comps.map(x => x.score!.score));
                    const min = Math.min(...comps.map(x => x.score!.score));
                    const color = avg > 60 ? '#ef4444' : avg > 35 ? '#eab308' : '#22c55e';
                    return (
                      <div key={industry} className="p-4 rounded-[10px] bg-surface-container-low border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-[11px] font-semibold text-on-surface">{industry}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant">{comps.length} company(ies)</span>
                        </div>
                        <div className="font-mono text-[28px] font-bold" style={{ color }}>{avg}</div>
                        <div className="h-1 bg-white/5 rounded mt-1 overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${Math.min(100, avg)}%`, background: color }} />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="font-mono text-[10px] text-on-surface-variant">low {min}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant">high {max}</span>
                        </div>
                        <div className="mt-3">
                          {comps.map(c => (
                            <div key={c.id} className="flex justify-between text-[12px] py-1 border-t border-white/5">
                              <Link href={`/company/${c.id}`} className="text-primary">{c.name}</Link>
                              <span className="font-mono" style={{ color: c.score!.score > 60 ? '#ef4444' : c.score!.score > 35 ? '#eab308' : '#22c55e' }}>{c.score!.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.section>
        )}

        {withScores.filter(x => x.score!.score > 60).length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel mt-6 p-5 rounded-xl border-l-[3px]" style={{ borderLeftColor: '#ef4444' }}>
            <div className="flex gap-3 items-center">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
              <div>
                <strong className="text-on-surface">Elevated risk detected</strong>
                <p className="text-on-surface-variant text-[13px] m-0">
                  {withScores.filter(x => x.score!.score > 60).map(x => x.name).join(', ')} have high risk scores. Review their AI predictions and opportunity reports for recommended actions.
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
