'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText, Lightbulb, BrainCircuit, Activity, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Target, BarChart3, ArrowUpRight, Search, Zap, Clock, Trash2,
  Database, Globe, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import Link from 'next/link';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreGauge({ score }: { score: number }) {
  const color = score > 60 ? '#ef4444' : score > 35 ? '#f59e0b' : '#10b981';
  const glow = score > 60 ? 'rgba(239, 68, 68, 0.4)' : score > 35 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: 'rgba(240,240,245,0.4)', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  hiring: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa' },
  news: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  patent: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  reddit_sentiment: { bg: 'rgba(236,72,153,0.1)', text: '#ec4899' },
  product_hunt: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa' },
  leadership: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  funding: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  product_launch: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa' },
};

function Badge({ type }: { type: string }) {
  const c = SIGNAL_COLORS[type] ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(240,240,245,0.7)' };
  return <span className="mono" style={{ fontSize: 10, background: c.bg, color: c.text, padding: '4px 9px', borderRadius: 8, fontWeight: 600, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{type.replace(/_/g, ' ')}</span>;
}

export default function Company() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportVisible, setReportVisible] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');

  async function load() {
    const r = await fetch(`/api/companies/${id}`);
    const data = await r.json();
    setD(data);
  }

  useEffect(() => { void load(); }, [id]);

  async function analyze() {
    setLoading(true);
    await fetch(`/api/companies/${id}/analyze`, { method: 'POST' });
    await load();
    setLoading(false);
  }

  async function getReport() {
    const r = await fetch(`/api/companies/${id}/report`);
    if (r.ok) {
      const data = await r.json();
      setReport(data);
      setReportVisible(true);
    }
  }

  if (!d) return <div className="dark-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(240,240,245,0.5)' }}>Loading...</div>;

  const signals: any[] = d.signals || [];
  const timeline: any[] = d.timeline || [];
  const score = d.riskScore;
  const signalTypes = Array.from(new Set(signals.map((s: any) => s.signalType)));
  const filteredSignals = filterType === 'all' ? signals : signals.filter((s: any) => s.signalType === filterType);

  return (
    <div className="dark-page bg-background text-on-surface min-h-screen">
      {/* Top Navbar */}
      <header style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px',
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AnimatedLogo />
          <span style={{
            fontSize: 9, fontWeight: 700, fontFamily: "'DM Mono', monospace",
            color: 'rgba(240,240,245,0.38)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 100,
            letterSpacing: '0.04em'
          }}>
            ALPHA V.2.4
          </span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="d-nav-links">
          <Link href="/dashboard" style={{ fontSize: 13.5, color: 'rgba(240,240,245,0.6)', fontWeight: 500, padding: '8px 14px', borderRadius: 8 }} className="d-nav-link">Watchlist</Link>
          <Link href="/opportunities" style={{ fontSize: 13.5, color: 'rgba(240,240,245,0.6)', fontWeight: 500, padding: '8px 14px', borderRadius: 8 }} className="d-nav-link">Opportunities</Link>
          <Link href="/dashboard" style={{ fontSize: 13.5, color: 'rgba(240,240,245,0.6)', fontWeight: 500, padding: '8px 14px', borderRadius: 8 }} className="d-nav-link">Dashboard</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/add" style={{
            fontSize: 13.5, fontWeight: 600, color: '#fff',
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #7c5cfc 0%, #4f8cff 100%)',
            border: '1px solid rgba(124,92,252,0.4)',
            boxShadow: '0 2px 12px rgba(124,92,252,0.25)',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            Add Company
          </Link>
        </div>
      </header>

      <style>{`
        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(240,240,245,0.48);
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          position: relative;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .tab-btn:hover {
          color: rgba(240,240,245,0.85);
        }
        .tab-btn.active {
          color: #f0f0f5;
        }
        .tab-active-indicator {
          position: absolute;
          bottom: -1px;
          left: 16px;
          right: 16px;
          height: 2px;
          background: #7c5cfc;
          box-shadow: 0 0 8px #7c5cfc;
        }
        .header-btn-ghost {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #f0f0f5;
          transition: all 0.2s ease;
        }
        .header-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .empty-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(124,92,252,0.08);
          border: 1px solid rgba(124,92,252,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 8px 24px rgba(124,92,252,0.1);
        }
        .glass-card-dark {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }
        .grid-3-col {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .grid-3-col {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="max-w-container-max mx-auto px-margin-desktop" style={{ paddingTop: 56, paddingBottom: 96 }}>
        {/* Title Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--d-accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              INTELLIGENCE WORKSPACE
            </span>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.04em', margin: '8px 0 12px', lineHeight: 1 }}>
              {d.name}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(240,240,245,0.4)' }}>
              {signals.length} signals{signals.some((s: any) => s.synthetic) ? ` (${signals.filter((s: any) => !s.synthetic).length} real, ${signals.filter((s: any) => s.synthetic).length} demo)` : ''} · AI-powered market intelligence
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={getReport}
              disabled={!score}
              className="btn header-btn-ghost"
              style={{ fontSize: 13.5, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10, opacity: !score ? 0.5 : 1 }}
            >
              <FileText size={15} /> Report
            </button>
            <button
              onClick={analyze}
              disabled={loading}
              className="btn"
              style={{
                fontSize: 13.5, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10,
                background: 'linear-gradient(135deg, #7c5cfc 0%, #4f8cff 100%)',
                color: '#fff', border: '1px solid rgba(124,92,252,0.4)',
                boxShadow: '0 4px 16px rgba(124,92,252,0.25)'
              }}
            >
              <Zap size={14} /> {loading ? 'Researching...' : 'Run AI research'}
            </button>
            <button
              onClick={async () => {
                if (d && confirm(`Remove ${d.name} from your watchlist?`)) {
                  await fetch(`/api/companies/${id}`, { method: 'DELETE' });
                  router.push('/dashboard');
                }
              }}
              className="btn header-btn-ghost"
              style={{ fontSize: 13.5, padding: '10px 14px', borderRadius: 10, color: 'var(--d-red)', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Strategy Report Card */}
        {reportVisible && report && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-dark"
            style={{ padding: 28, borderRadius: 20, marginBottom: 32, borderLeft: '4px solid var(--d-accent)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--d-accent)', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <FileText size={14} /> {report.title}
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(240,240,245,0.7)', marginTop: 12, marginBottom: 18 }}>{report.summary}</p>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {report.recommendations?.slice(0, 3).map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'rgba(240,240,245,0.5)' }}>
                  <ArrowUpRight size={15} color="var(--d-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <span style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)', fontFamily: "'DM Mono', monospace" }}>{report.disclaimer}</span>
              <button onClick={() => setReportVisible(false)} className="btn header-btn-ghost" style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 8 }}>Dismiss</button>
            </div>
          </motion.section>
        )}

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 1 }}>
          {['overview', 'signals', 'timeline'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); }}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && <div className="tab-active-indicator" />}
            </button>
          ))}
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {score ? (
              <>
                <section style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.7fr) minmax(320px, 2fr)', gap: 20, marginTop: 10 }} className="overview-top-grid">
                  <style>{`
                    @media (max-width: 768px) {
                      .overview-top-grid {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>
                  {/* Gauge Card */}
                  <article className="glass-card-dark" style={{ padding: 28, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(240,240,245,0.4)', letterSpacing: '0.08em', marginBottom: 16 }}>MARKET RISK SCORE</div>
                    <ScoreGauge score={score.score} />
                    <span style={{ fontSize: 12, color: 'rgba(240,240,245,0.3)', marginTop: 16 }}>derived from {signals.filter((s: any) => !s.synthetic).length} real signals{signals.some((s: any) => s.synthetic) ? ` (${signals.filter((s: any) => s.synthetic).length} demo excluded)` : ''}</span>
                  </article>

                  {/* Summary Card */}
                  <article className="glass-card-dark" style={{ padding: 28, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--d-accent)', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        <BrainCircuit size={14} /> AI Executive Summary
                      </div>
                      <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(240,240,245,0.7)', margin: 0 }}>{score.explanation}</p>
                    </div>
                    <small style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'rgba(240,240,245,0.3)', display: 'block', marginTop: 18 }}>
                      Last evidence run {formatDate(score.computedAt)}
                    </small>
                  </article>
                </section>

                {/* Score Breakdown */}
                <section className="glass-card-dark" style={{ padding: 24, borderRadius: 20, marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--d-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                    <BarChart3 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Score Breakdown
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
                    {Object.entries(score.breakdown || {}).map(([k, v]: any) => (
                      <div key={k} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 }}>
                        <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: '#f0f0f5' }}>{v}</div>
                        <div style={{ fontSize: 11, color: 'rgba(240,240,245,0.4)', textTransform: 'capitalize', marginTop: 2 }}>{k.replace(/_/g, ' ')}</div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 50, marginTop: 12, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.max(4, Math.min(100, v))}%`, background: v > 15 ? 'var(--d-red)' : v > 8 ? 'var(--d-yellow)' : 'var(--d-green)', borderRadius: 50 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Risk Trend Chart */}
                {d.scoreHistory && d.scoreHistory.length > 1 && (
                  <section className="glass-card-dark" style={{ padding: 24, borderRadius: 20, marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--d-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                      <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Risk Trend Line
                    </div>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...d.scoreHistory, { score: score.score, computedAt: score.computedAt }].map((s: any) => ({ ...s, computedAt: new Date(s.computedAt).getTime() }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="computedAt" tickFormatter={(t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="rgba(240,240,245,0.4)" fontSize={11} />
                          <YAxis domain={[0, 100]} stroke="rgba(240,240,245,0.4)" fontSize={11} />
                          <Tooltip
                            contentStyle={{ background: '#0a0a0f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }}
                            labelFormatter={(t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            formatter={(v: number) => [`${v}`, 'Risk score']}
                          />
                          <ReferenceLine y={35} stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="4 4" />
                          <ReferenceLine y={60} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="score" stroke="var(--d-accent)" strokeWidth={2} dot={{ fill: 'var(--d-accent)', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* AI Predictions & Opportunities */}
                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }} className="preds-opps-grid">
                  <style>{`
                    @media (max-width: 840px) {
                      .preds-opps-grid {
                        grid-template-columns: 1fr !important;
                      }
                    }
                  `}</style>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--d-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                      <BrainCircuit size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> AI Predictions
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {(score.predictions || []).map((p: any, i: number) => (
                        <article key={p.id || p.title || i} className="glass-card-dark" style={{ padding: 20, borderRadius: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {p.direction === 'Watch' ? <AlertTriangle size={15} color="#f59e0b" /> : p.direction === 'Positive' ? <TrendingUp size={15} color="#22c55e" /> : <Minus size={15} color="rgba(240,240,245,0.4)" />}
                              <strong style={{ fontSize: 14, color: '#f0f0f5' }}>{p.title}</strong>
                            </div>
                            <span className="mono" style={{ fontSize: 11, color: p.confidence > 70 ? '#f59e0b' : 'rgba(240,240,245,0.4)', fontWeight: 600 }}>{p.confidence}%</span>
                          </div>
                          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(240,240,245,0.5)', marginTop: 8, marginBottom: 0 }}>{p.rationale}</p>
                          
                          {p.evidence && p.evidence.length > 0 && (
                            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <small style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'rgba(240,240,245,0.3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Evidence</small>
                              {p.evidence.map((ev: any, ei: number) => (
                                <div key={ei} style={{ display: 'flex', gap: 8, alignItems: 'start', marginTop: 6, fontSize: 12 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.weight > 0.6 ? 'var(--d-red)' : 'rgba(240,240,245,0.3)', flexShrink: 0, marginTop: 4 }} />
                                  {ev.sourceUrl ? (
                                    <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(240,240,245,0.48)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      {ev.summary} <ArrowUpRight size={11} />
                                    </a>
                                  ) : (
                                    <span style={{ color: 'rgba(240,240,245,0.48)' }}>{ev.summary}</span>
                                  )}
                                  <span className="mono" style={{ fontSize: 10, color: 'rgba(240,240,245,0.3)', flexShrink: 0, marginLeft: 'auto' }}>w:{ev.weight.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: 'var(--d-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                      <Lightbulb size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Opportunities
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {(score.opportunities || []).map((o: any, i: number) => (
                        <article key={o.id || o.title || i} className="glass-card-dark" style={{ padding: 20, borderRadius: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <strong style={{ fontSize: 14, color: '#f0f0f5' }}>{o.title}</strong>
                            <span className="mono" style={{ fontSize: 9, color: o.impact === 'High' ? 'var(--d-accent)' : 'rgba(240,240,245,0.4)', fontWeight: 700, background: o.impact === 'High' ? 'rgba(124,92,252,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${o.impact === 'High' ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.06)'}`, padding: '2px 6px', borderRadius: 4 }}>{o.impact} IMPACT</span>
                          </div>
                          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(240,240,245,0.5)', marginTop: 8, marginBottom: 8 }}>{o.action}</p>
                          <small style={{ fontSize: 12, color: 'rgba(240,240,245,0.35)' }}>{o.reason}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* Upgraded Premium Empty State (matches mockup exactly) */
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card-dark"
                style={{ padding: '56px 32px 48px', borderRadius: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.04em', margin: '0 0 12px' }}>
                  Start with evidence.
                </h2>
                
                <p style={{ fontSize: 14.5, color: 'rgba(240,240,245,0.48)', maxWidth: 460, lineHeight: 1.6, margin: '0 0 32px' }}>
                  Deploy the AI research agent to scan global patent filings, alternative data, and executive sentiment to construct a real-time intelligence profile for {d.name}.
                </p>

                <button
                  onClick={analyze}
                  disabled={loading}
                  style={{
                    padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14.5,
                    background: 'linear-gradient(135deg, #7c5cfc 0%, #4f8cff 100%)',
                    color: '#fff', border: '1px solid rgba(124,92,252,0.4)',
                    boxShadow: '0 6px 20px rgba(124,92,252,0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.8 : 1,
                    marginBottom: 56
                  }}
                >
                  <Zap size={15} /> {loading ? 'Researching...' : 'Run AI research'}
                </button>

                {/* Sub-cards row */}
                <div className="grid-3-col" style={{ width: '100%', maxWidth: 840, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'left' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Database size={14} color="#60a5fa" />
                    </div>
                    <strong style={{ fontSize: 13.5, color: '#f0f0f5', marginBottom: 4 }}>Signal Sourcing</strong>
                    <p style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)', lineHeight: 1.5, margin: 0 }}>Crawling 400+ public and proprietary data sources.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'left' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(124,92,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Globe size={14} color="var(--d-accent)" />
                    </div>
                    <strong style={{ fontSize: 13.5, color: '#f0f0f5', marginBottom: 4 }}>Causal Inference</strong>
                    <p style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)', lineHeight: 1.5, margin: 0 }}>Identifying hidden links between market shifts.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'left' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <ShieldCheck size={14} color="#10b981" />
                    </div>
                    <strong style={{ fontSize: 13.5, color: '#f0f0f5', marginBottom: 4 }}>Risk Modeling</strong>
                    <p style={{ fontSize: 12, color: 'rgba(240,240,245,0.4)', lineHeight: 1.5, margin: 0 }}>Quantifying exposure and growth probability.</p>
                  </div>
                </div>
              </motion.section>
            )}
          </>
        )}

        {/* Signals Tab Content */}
        {activeTab === 'signals' && (
          <div>
            {signals.length > 0 ? (
              <>
                {/* Type Filters */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  <button
                    className="tab-btn"
                    style={{
                      fontSize: 12.5, borderRadius: 8, padding: '6px 12px',
                      background: filterType === 'all' ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: `1px solid ${filterType === 'all' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                      color: filterType === 'all' ? '#f0f0f5' : 'rgba(240,240,245,0.5)'
                    }}
                    onClick={() => setFilterType('all')}
                  >
                    All ({signals.length})
                  </button>
                  {signalTypes.map((t: string) => (
                    <button
                      key={t}
                      className="tab-btn"
                      style={{
                        fontSize: 12.5, borderRadius: 8, padding: '6px 12px',
                        background: filterType === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                        border: `1px solid ${filterType === t ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                        color: filterType === t ? '#f0f0f5' : 'rgba(240,240,245,0.5)',
                        textTransform: 'capitalize'
                      }}
                      onClick={() => setFilterType(t)}
                    >
                      {t.replace(/_/g, ' ')} ({signals.filter((s: any) => s.signalType === t).length})
                    </button>
                  ))}
                </div>

                {/* Signals Feed */}
                <div style={{ display: 'grid', gap: 12 }}>
                  {filteredSignals.slice().reverse().map((s: any, idx: number) => (
                    <article className="glass-card-dark" style={{ padding: 20, borderRadius: 16 }} key={s.id || idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Badge type={s.signalType} />
                          {s.synthetic && (
                            <span className="mono" style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', letterSpacing: '0.06em' }}>
                              DEMO
                            </span>
                          )}
                          <strong style={{ fontSize: 14.5, color: '#f0f0f5' }}>{s.title || 'Signal'}</strong>
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)' }}>{formatDate(s.detectedAt)}</span>
                      </div>
                      
                      {s.description && (
                        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(240,240,245,0.5)', marginTop: 10, marginBottom: 0 }}>
                          {s.description}
                        </p>
                      )}

                      {(s.sentimentScore !== undefined || s.sourceUrl) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          {s.sentimentScore !== undefined ? (
                            <span className="mono" style={{ fontSize: 11, color: (s.sentimentScore ?? 0) < 0 ? 'var(--d-red)' : (s.sentimentScore ?? 0) > 0.3 ? 'var(--d-green)' : 'rgba(240,240,245,0.4)' }}>
                              sentiment: {(s.sentimentScore ?? 0) > 0 ? '+' : ''}{(s.sentimentScore ?? 0).toFixed(2)}
                            </span>
                          ) : <div />}
                          
                          {s.sourceUrl && (
                            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--d-accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              Source <ArrowUpRight size={13} />
                            </a>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-card-dark" style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}>
                <p style={{ color: 'rgba(240,240,245,0.4)', margin: 0 }}>No signals collected yet. Run AI research to collect them.</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab Content */}
        {activeTab === 'timeline' && (
          <div style={{ marginTop: 8 }}>
            {timeline.length > 0 ? (
              <div style={{ position: 'relative' }}>
                {/* Vertical timeline line */}
                <div style={{ position: 'absolute', left: 24, top: 8, bottom: 8, width: 1, background: 'rgba(255,255,255,0.08)' }} />
                
                {timeline.slice().reverse().map((e: any, i: number) => (
                  <div key={e.id || i} style={{ position: 'relative', paddingLeft: 56, paddingBottom: 28 }}>
                    {/* Ring dot */}
                    <div style={{
                      position: 'absolute', left: 18, top: 4, width: 13, height: 13, borderRadius: '50%',
                      background: (e.impactWeight ?? 0) > 5 ? 'var(--d-red)' : (e.impactWeight ?? 0) > 2 ? 'var(--d-yellow)' : 'var(--d-green)',
                      border: '3px solid #0a0a0f',
                      boxShadow: `0 0 10px ${(e.impactWeight ?? 0) > 5 ? 'rgba(239,68,68,0.4)' : (e.impactWeight ?? 0) > 2 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                      zIndex: 1,
                    }} />

                    <article className="glass-card-dark" style={{ padding: 18, borderRadius: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Badge type={e.signalType} />
                          <strong style={{ fontSize: 14, color: '#f0f0f5' }}>{e.title}</strong>
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: 'rgba(240,240,245,0.3)' }}>{formatDate(e.eventDate)}</span>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(240,240,245,0.5)', marginTop: 8, margin: 0 }}>
                        {e.description}
                      </p>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card-dark" style={{ padding: 32, borderRadius: 20, textAlign: 'center' }}>
                <Clock size={24} color="rgba(240,240,245,0.3)" style={{ marginBottom: 8 }} />
                <p style={{ color: 'rgba(240,240,245,0.4)', margin: 0 }}>No timeline events yet. Run AI research to populate the timeline.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="w-full py-12 border-t border-white/5 bg-surface-container-lowest mt-16">
        <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
          <div>
            <div className="text-[14px] font-[800] tracking-[-0.04em] text-on-surface mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Market<span className="text-primary">Autopsy</span> AI
            </div>
            <div className="text-[11px] text-on-surface-variant/40">&copy; 2026 MarketAutopsy AI. Enterprise Intelligence Operating System.</div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
            {['Privacy Policy', 'Terms of Service', 'Security', 'Contact Sales'].map((label) => (
              <Link key={label} href="#" className="text-[12px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
