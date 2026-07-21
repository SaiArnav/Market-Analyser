'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Building2, FileText, Users, BrainCircuit,
  Target, TrendingUp, Lightbulb, Shield
} from 'lucide-react';
import { DarkTopNav } from '@/components/ui/DarkTopNav';
import Link from 'next/link';

export default function Add() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    try {
      const r = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await r.json();
      setSaving(false);
      if (!r.ok) {
        setError(json.detail || 'An error occurred while creating the workspace.');
        return;
      }
      router.push(`/company/${json.id}`);
    } catch {
      setSaving(false);
      setError('Failed to connect to the server.');
    }
  }

  const fields = [
    { name: 'name', label: 'Company Name', placeholder: 'e.g. Acme Corp', required: true, type: 'text' },
    { name: 'industry', label: 'Industry', placeholder: 'e.g. Fintech', required: false, type: 'text' },
    { name: 'website', label: 'Company Website', placeholder: 'https://acme.com', required: false, type: 'text' },
    { name: 'foundedYear', label: 'Founded Year', placeholder: '2018', required: false, type: 'number' },
    { name: 'greenhouseToken', label: 'Greenhouse Board Token', placeholder: 'Optional', required: false, type: 'text' },
    { name: 'leverSlug', label: 'Lever Company Slug', placeholder: 'Optional', required: false, type: 'text' },
  ];

  const agentCards = [
    { icon: FileText, title: 'News Agent', subtitle: 'SCANNING 1,240 ARTICLES', color: '#60a5fa', width: ['20%', '85%', '20%'], dur: 6, delay: 0 },
    { icon: Users, title: 'Hiring Agent', subtitle: '83 NEW OPENINGS', color: '#7c5cfc', width: ['40%', '95%', '40%'], dur: 5, delay: 1 },
    { icon: Target, title: 'Patent Agent', subtitle: '12 ACTIVE FILINGS', color: '#eab308', width: ['10%', '60%', '10%'], dur: 4, delay: 2 },
  ];

  const rightCards = [
    { icon: TrendingUp, title: 'Market Prediction', subtitle: 'UPWARD MOMENTUM', color: '#22c55e' },
    { icon: Lightbulb, title: 'Opportunities', subtitle: '4 STRATEGIC PIVOTS', color: '#a78bfa' },
    { icon: FileText, title: 'Executive Report', subtitle: 'READY IN 2M', color: 'rgba(240,240,245,0.6)' },
  ];

  return (
    <div className="dark-page bg-background text-on-surface min-h-screen">
      <DarkTopNav />

      <style>{`
        .add-page-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 48px;
        }
        .agent-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          padding: 12px 14px;
          width: 180px;
          height: 60px;
          position: absolute;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: border-color 0.25s, transform 0.25s;
        }
        .agent-card:hover {
          border-color: rgba(124,92,252,0.35);
          transform: translateY(-2px);
        }
        @media (max-width: 960px) {
          .add-page-grid { grid-template-columns: 1fr; gap: 64px; }
          .viz-col { display: flex; justify-content: center; }
        }
        @media (max-width: 540px) {
          .form-fields-grid { grid-template-columns: 1fr !important; }
          .viz-scale-wrapper { transform: scale(0.85); transform-origin: center top; height: 320px; }
        }
        @media (max-width: 440px) {
          .viz-scale-wrapper { transform: scale(0.72); transform-origin: center top; height: 270px; }
        }
        @media (max-width: 360px) {
          .viz-scale-wrapper { transform: scale(0.6); transform-origin: center top; height: 230px; }
        }
      `}</style>

      <div className="max-w-container-max mx-auto px-margin-desktop" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 48 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-medium tracking-[0.08em] uppercase mb-4">
            NEW MARKET INTELLIGENCE WORKSPACE
          </div>
          <h1 className="text-[clamp(32px,5vw,46px)] font-[800] tracking-[-0.04em] text-on-surface mb-4 leading-[1.1]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Start a New Investigation.
          </h1>
          <p className="text-on-surface-variant text-[15px] leading-[1.65] max-w-[660px] m-0">
            Create an AI-powered monitoring workspace for any company. MarketAutopsy runs on-demand deep research using public signals — news, hiring, patents, sentiment, leadership changes, funding activity, product launches, and market intelligence.
          </p>
        </motion.div>

        <div className="add-page-grid">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <form onSubmit={submit} className="glass-panel p-7 rounded-2xl grid gap-6">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <Building2 size={16} className="text-primary" />
                </div>
                <h3 className="text-[17px] font-bold m-0 text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>Company Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {fields.map((f) => (
                  <label key={f.name} className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-on-surface-variant">
                      {f.label} {f.required && <span className="text-primary">*</span>}
                    </span>
                    <input
                      required={f.required}
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      min={f.name === 'foundedYear' ? 1900 : undefined}
                      max={f.name === 'foundedYear' ? new Date().getFullYear() : undefined}
                      className="px-3.5 py-2.5 rounded-[10px] bg-surface-container-low border border-white/10 text-on-surface outline-none text-[14px] transition-all focus:border-primary/40 focus:bg-surface-container"
                    />
                  </label>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/25 text-red-400 text-[13.5px]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-5 rounded-xl font-semibold text-[15px] bg-primary text-on-primary border border-primary/40 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed hover:opacity-90"
              >
                {saving ? 'Launching Workspace...' : 'Launch Workspace'}
                <ArrowUpRight size={16} />
              </button>

              <div className="text-center text-[12px] text-on-surface-variant/60">
                <Shield size={12} className="inline mr-1" />
                Public data sources only
              </div>
            </form>
          </motion.div>

          <div className="viz-col flex items-center justify-center">
            <div className="viz-scale-wrapper w-[540px] h-[380px] relative">
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 540 380">
                <defs>
                  <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#4f8cff" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {[
                  { id: 1, d: "M 180 40 C 200 40, 195 150, 215 150" },
                  { id: 2, d: "M 180 185 H 215" },
                  { id: 3, d: "M 180 330 C 200 330, 195 210, 215 210" },
                  { id: 4, d: "M 360 40 C 340 40, 345 150, 325 150" },
                  { id: 5, d: "M 360 185 H 325" },
                  { id: 6, d: "M 360 330 C 340 330, 345 210, 325 210" },
                ].map((conn) => (
                  <g key={conn.id}>
                    <path d={conn.d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                    <motion.path d={conn.d} fill="none" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 6"
                      animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                    <motion.path d={conn.d} fill="none" stroke="rgba(124,92,252,0.8)" strokeWidth="2" strokeDasharray="8 100"
                      animate={{ strokeDashoffset: [120, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: conn.id * 0.3 }} />
                  </g>
                ))}
              </svg>

              <motion.div
                animate={{ boxShadow: ["0 0 20px rgba(124,92,252,0.2)", "0 0 35px rgba(124,92,252,0.4)", "0 0 20px rgba(124,92,252,0.2)"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[125px] left-[215px] w-[110px] h-[110px] rounded-2xl flex flex-col items-center justify-center z-[2]"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,92,252,0.3) 0%, rgba(79,140,255,0.2) 100%)',
                  border: '1px solid rgba(124,92,252,0.4)',
                  boxShadow: '0 8px 32px rgba(124,92,252,0.2)',
                }}
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <BrainCircuit size={28} className="text-[#a78bfa]" style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }} />
                </motion.div>
                <span className="text-[13px] font-bold text-on-surface mt-2 tracking-[-0.01em]">Reasoning</span>
                <span className="text-[9px] font-mono text-[#a78bfa] font-semibold mt-0.5">CONFIDENCE 92%</span>
              </motion.div>

              {agentCards.map((card, i) => (
                <div key={card.title} className="agent-card" style={{ top: i === 0 ? 12 : i === 1 ? 157 : 302, left: 0 }}>
                  <div className="flex gap-2.5 items-center">
                    <card.icon size={15} style={{ color: card.color }} />
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-on-surface">{card.title}</div>
                      <div className="text-[8px] font-mono text-on-surface-variant/60 tracking-[0.02em] mt-0.5">{card.subtitle}</div>
                    </div>
                  </div>
                  <div className="h-[3px] bg-white/5 rounded-full overflow-hidden mt-1.5">
                    <motion.div animate={{ width: card.width }} transition={{ duration: card.dur, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
                      className="h-full rounded-full" style={{ background: card.color }} />
                  </div>
                </div>
              ))}

              {rightCards.map((card, i) => (
                <div key={card.title} className="agent-card" style={{ top: i === 0 ? 12 : i === 1 ? 157 : 302, right: 0, left: 'auto' }}>
                  <div className="flex gap-2.5 items-center h-full">
                    <card.icon size={15} style={{ color: card.color }} />
                    <div>
                      <div className="text-[11px] font-semibold text-on-surface">{card.title}</div>
                      <div className="text-[8px] font-mono mt-0.5" style={{ color: card.color, fontWeight: 600, letterSpacing: '0.02em' }}>{card.subtitle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
