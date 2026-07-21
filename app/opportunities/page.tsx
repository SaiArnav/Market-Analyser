'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lightbulb, Target, TrendingUp, ArrowUpRight, Search, Star, Crosshair, Plus } from 'lucide-react';
import { DarkTopNav } from '@/components/ui/DarkTopNav';

type Opportunity = {
  id: string; title: string; action: string; impact: string; effort: string; category: string; reason: string; evidenceLink: string;
};
type Prediction = {
  id: string; title: string; direction: string; confidence: number;
};
type CompanyData = {
  id: string; name: string; industry?: string;
  score?: { score: number; computedAt: string; breakdown: Record<string, number>; predictions: Prediction[]; opportunities: Opportunity[] };
};

const categoryIcons: Record<string, typeof Lightbulb> = {
  customer_acquisition: Target,
  product_gap: Crosshair,
  market_entry: TrendingUp,
  partnership: Star,
  positioning: Search,
};

const categoryLabels: Record<string, string> = {
  customer_acquisition: 'Customer Acquisition',
  product_gap: 'Product Gap',
  market_entry: 'Market Entry',
  partnership: 'Partnership',
  positioning: 'Positioning',
};

export default function Opportunities() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'effort'>('impact');

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then(setCompanies);
  }, []);

  const allOpportunities: { opp: Opportunity; company: CompanyData }[] = [];
  companies.filter(c => c.score?.opportunities).forEach(c => {
    c.score!.opportunities.forEach(opp => {
      allOpportunities.push({ opp, company: c });
    });
  });

  const categories = Array.from(new Set(allOpportunities.map(o => o.opp.category)));

  const filtered = selectedCategory === 'all'
    ? allOpportunities
    : allOpportunities.filter(o => o.opp.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'impact') {
      const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
      return (order[b.opp.impact] ?? 0) - (order[a.opp.impact] ?? 0);
    }
    const order: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
    return (order[a.opp.effort] ?? 0) - (order[b.opp.effort] ?? 0);
  });

  const highImpact = allOpportunities.filter(o => o.opp.impact === 'High').length;
  const companiesWithOpps = new Set(allOpportunities.map(o => o.company.id)).size;

  return (
    <div className="dark-page bg-background text-on-surface min-h-screen">
      <DarkTopNav />
      <div className="max-w-[1200px] mx-auto px-6" style={{ paddingTop: 96, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200 }}>
          <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase">Opportunity explorer</div>
          <h1 className="text-[36px] font-[800] tracking-[-.05em] my-2 text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>Find the whitespace.</h1>
          <p className="text-on-surface-variant max-w-[600px] text-[16px] leading-[1.6]">
            When a competitor weakens or a market changes, AI recommends actionable opportunities. Each recommendation is linked to the specific evidence that triggered it.
          </p>
        </div>

        {allOpportunities.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 mt-6 rounded-xl"
          >
            <div className="text-primary text-[11px] font-mono font-medium tracking-[.08em] uppercase">Opportunity dashboard</div>
            <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div>
                <div className="font-mono text-[28px] font-semibold text-on-surface">{allOpportunities.length}</div>
                <span className="text-on-surface-variant text-[11px]">Total opportunities</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold text-primary">{highImpact}</div>
                <span className="text-on-surface-variant text-[11px]">High impact</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold text-on-surface">{companiesWithOpps}</div>
                <span className="text-on-surface-variant text-[11px]">Companies with opportunities</span>
              </div>
              <div>
                <div className="font-mono text-[28px] font-semibold text-on-surface">{categories.length}</div>
                <span className="text-on-surface-variant text-[11px]">Categories</span>
              </div>
            </div>
          </motion.section>
        )}

        <div className="flex gap-2 mt-6 flex-wrap items-center">
          <button className="px-3.5 py-1.5 text-[12px] rounded-[10px] border font-medium transition-all"
            style={{ borderColor: selectedCategory === 'all' ? 'var(--d-accent, #7c5cfc)' : 'rgba(255,255,255,0.08)', background: selectedCategory === 'all' ? 'rgba(124,92,252,0.1)' : 'transparent', color: selectedCategory === 'all' ? 'var(--d-accent, #7c5cfc)' : 'var(--d-muted, rgba(240,240,245,0.45))' }}
            onClick={() => setSelectedCategory('all')}>
            All ({allOpportunities.length})
          </button>
          {categories.map(cat => (
            <button key={cat} className="px-3.5 py-1.5 text-[12px] rounded-[10px] border font-medium transition-all"
              style={{ borderColor: selectedCategory === cat ? 'var(--d-accent, #7c5cfc)' : 'rgba(255,255,255,0.08)', background: selectedCategory === cat ? 'rgba(124,92,252,0.1)' : 'transparent', color: selectedCategory === cat ? 'var(--d-accent, #7c5cfc)' : 'var(--d-muted, rgba(240,240,245,0.45))' }}
              onClick={() => setSelectedCategory(cat)}>
              {categoryLabels[cat] || cat} ({allOpportunities.filter(o => o.opp.category === cat).length})
            </button>
          ))}
          <div className="ml-auto flex gap-1.5 items-center">
            <span className="text-on-surface-variant text-[11px]">Sort:</span>
            <button className="px-2.5 py-1 text-[11px] rounded-[10px] border font-medium transition-all"
              style={{ borderColor: sortBy === 'impact' ? 'var(--d-accent, #7c5cfc)' : 'rgba(255,255,255,0.08)', background: sortBy === 'impact' ? 'rgba(124,92,252,0.1)' : 'transparent', color: sortBy === 'impact' ? 'var(--d-accent, #7c5cfc)' : 'var(--d-muted, rgba(240,240,245,0.45))' }}
              onClick={() => setSortBy('impact')}>Impact</button>
            <button className="px-2.5 py-1 text-[11px] rounded-[10px] border font-medium transition-all"
              style={{ borderColor: sortBy === 'effort' ? 'var(--d-accent, #7c5cfc)' : 'rgba(255,255,255,0.08)', background: sortBy === 'effort' ? 'rgba(124,92,252,0.1)' : 'transparent', color: sortBy === 'effort' ? 'var(--d-accent, #7c5cfc)' : 'var(--d-muted, rgba(240,240,245,0.45))' }}
              onClick={() => setSortBy('effort')}>Effort</button>
          </div>
        </div>

        {sorted.length > 0 ? (
          <section className="grid gap-4 mt-5">
            {sorted.map(({ opp, company }, i) => {
              const I = categoryIcons[opp.category] || Lightbulb;
              return (
                <motion.article key={opp.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.35 }}
                  className="glass-panel p-5 rounded-xl border-l-[3px] group hover:border-primary/30 transition-all"
                  style={{ borderLeftColor: opp.impact === 'High' ? 'var(--d-accent, #7c5cfc)' : 'transparent' }}
                >
                  <div className="flex justify-between gap-4 items-start">
                    <div className="flex gap-3 items-start">
                      <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <I size={20} className="text-primary" />
                      </div>
                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <strong className="text-[15px] text-on-surface">{opp.title}</strong>
                          <span className="font-mono text-[10px] font-semibold" style={{ color: opp.impact === 'High' ? 'var(--d-accent, #7c5cfc)' : opp.impact === 'Medium' ? 'var(--d-muted)' : 'rgba(240,240,245,0.3)' }}>
                            {opp.impact.toUpperCase()} IMPACT
                          </span>
                          <span className="font-mono text-[10px] text-on-surface-variant">{opp.effort.toUpperCase()} EFFORT</span>
                        </div>
                        <p className="text-on-surface-variant text-[14px] leading-[1.6] mt-1.5">{opp.action}</p>
                        <div className="flex gap-3 items-center mt-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">
                            {categoryLabels[opp.category] || opp.category}
                          </span>
                          <span className="text-on-surface-variant text-[12px]">
                            From: <Link href={`/company/${company.id}`} className="text-primary">{company.name}</Link>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex gap-2 items-start">
                      <Lightbulb size={12} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-on-surface-variant text-[12px]">{opp.reason}</span>
                    </div>
                    {opp.evidenceLink && (
                      <a href={opp.evidenceLink} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 items-center text-[11px] text-primary mt-2">
                        View source evidence <ArrowUpRight size={11} />
                      </a>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </section>
        ) : (
          <section className="glass-panel p-10 rounded-xl text-center mt-6">
            <Search size={32} className="text-on-surface-variant mx-auto mb-3" />
            <h3 className="text-on-surface text-lg font-semibold">No opportunities yet</h3>
            <p className="text-on-surface-variant max-w-[400px] mx-auto mb-4 text-[14px]">
              Opportunities are generated from AI analysis when you run research on a company.
              Add companies and run AI research to see opportunities here.
            </p>
            <Link href="/add" className="inline-flex items-center gap-2 px-4 py-3 rounded-[10px] font-semibold bg-primary text-on-primary">
              <Plus size={16} /> Add a company
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
