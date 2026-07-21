'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, Activity, Search, BrainCircuit, Lightbulb,
  FileText, TrendingUp, Shield, Zap, ChevronRight, LogIn, UserPlus,
} from 'lucide-react';
import { ShaderBackground } from './ShaderBackground';
import { BrainAnimation } from './BrainAnimation';

/* ─── Fade-in observer hook ─────────────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
function DarkNav() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-container-max rounded-full border border-white/10 bg-surface/80 backdrop-blur-3xl shadow-2xl z-50 flex justify-between items-center px-8 py-3">
      <div className="flex items-center gap-12">
        <span className="text-[24px] font-semibold tracking-tighter text-on-surface">MarketAutopsy</span>
        <div className="hidden md:flex gap-8">
          <a href="#features" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">Platform</a>
          <Link href="/dashboard" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">Dashboard</Link>
          <Link href="/opportunities" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">Opportunities</Link>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <Link href="/login" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-on-surface-variant hover:text-on-surface border border-white/10 hover:border-white/20 transition-all">
          <LogIn size={13} />
          Login
        </Link>
        <Link href="/signup" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-primary text-on-primary border border-primary/40 transition-all hover:opacity-90">
          <UserPlus size={13} />
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

/* ─── HERO SECTION ────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <ShaderBackground />

      <div className="relative z-10 max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center w-full">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-[400] leading-[1.4]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            LIVE MARKET INTELLIGENCE ACTIVATED
          </div>

          {/* Headline */}
          <h1 className="text-[64px] leading-[1] tracking-tighter text-on-surface max-w-xl font-[700]" style={{ fontFamily: 'Inter, sans-serif' }}>
            See Market Shifts <span className="text-primary">Before</span> They Become Headlines.
          </h1>

          <p className="text-[16px] leading-[1.6] text-on-surface-variant max-w-lg">
            MarketAutopsy connects public signals across hiring, news, patents, and product activity—then uses AI to reason over the evidence, detect emerging trends, and generate actionable strategic recommendations.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/add"
              className="bg-primary text-on-primary font-bold px-8 py-4 rounded-full text-[12px] font-[500] tracking-[0.05em] hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 inline-flex items-center gap-2"
            >
              Start AI Investigation <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Three.js Brain */}
        <div className="hidden lg:block relative h-[600px]">
          <BrainAnimation />
        </div>
      </div>
    </section>
  );
}

/* ─── WORKFLOW SECTION ────────────────────────────────────────────────────── */
function WorkflowSection() {
  const ref = useFadeIn() as React.RefObject<HTMLDivElement>;
  const steps = [
    { step: 'Company Input', icon: Search, desc: 'Enter any company name to begin deep market analysis.' },
    { step: 'AI Research', icon: Activity, desc: 'Automated scraping of public data across hiring, patents, and news.' },
    { step: 'Signal Detection', icon: BrainCircuit, desc: 'Identify subtle patterns that precede major market shifts.' },
    { step: 'Reasoning', icon: Lightbulb, desc: 'AI analyzes evidence and connects strategic dots.' },
    { step: 'Prediction', icon: TrendingUp, desc: 'Probabilistic modeling of future competitor moves.' },
    { step: 'Opportunities', icon: ChevronRight, desc: 'Surface competitive weaknesses and untapped whitespace.' },
    { step: 'Exec Report', icon: FileText, desc: 'Generate boardroom-ready documentation with strategic logic.' },
  ];

  return (
    <section ref={ref} className="py-32 fade-in-scroll">
      <div className="max-w-container-max mx-auto px-margin-desktop text-center mb-16">
        <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] mb-4">From question to strategy in 7 steps.</h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-[16px] leading-[1.6]">
          The entire flow — from entering a company name to receiving strategic recommendations — happens in a single workspace.
        </p>
      </div>
      <div className="max-w-container-max mx-auto px-margin-desktop">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {steps.map(({ step, icon: Icon, desc }, i) => (
            <div
              key={step}
              className={`glass-panel p-6 rounded-xl flex flex-col items-center text-center gap-3 group transition-all hover:border-primary/30 ${i === steps.length - 1 ? 'border-primary/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[12px] font-[500] ${i === steps.length - 1 ? 'bg-primary text-on-primary' : 'bg-primary/20 text-primary'}`}>
                {i + 1}
              </div>
              <Icon size={16} className="text-primary/60 group-hover:text-primary transition-colors" />
              <span className="text-[12px] font-[500] leading-[1] tracking-[0.05em] font-semibold">{step}</span>
              <p className="text-[11px] leading-[1.4] text-on-surface-variant/60 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CORE INTELLIGENCE ENGINES ────────────────────────────────────────────── */
function CoreEnginesSection() {
  const ref = useFadeIn() as React.RefObject<HTMLDivElement>;
  const engines = [
    { icon: Search, title: 'AI Research', desc: 'Continuous scraping and normalization of fragmented public data into a unified market view.' },
    { icon: Activity, title: 'Signal Detection', desc: 'Identifies subtle patterns in hiring, patents, and reviews that precede major market shifts.' },
    { icon: TrendingUp, title: 'Market Prediction', desc: 'Probabilistic modeling of future competitor moves with rigorous confidence scoring.' },
    { icon: Lightbulb, title: 'Discovery', desc: 'Automatic surfacing of "white spaces" where competitors are weak or failing to innovate.' },
    { icon: FileText, title: 'Executive Reports', desc: 'Instant, boardroom-ready documentation summarizing evidence and strategic logic.' },
    { icon: BrainCircuit, title: 'Comp Intel', desc: 'Head-to-head analysis of health metrics across your entire competitive landscape.' },
  ];

  return (
    <section ref={ref} className="py-32 bg-surface-container-lowest/50 fade-in-scroll">
      <div className="max-w-container-max mx-auto px-margin-desktop">
        <div className="mb-16">
          <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] mb-4">Core Intelligence Engines</h2>
          <p className="text-on-surface-variant text-[16px] leading-[1.6]">The architecture behind MarketAutopsy&rsquo;s forensic analysis.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {engines.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel p-8 rounded-xl group hover:border-primary/40 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] mb-2">{title}</h3>
              <p className="text-on-surface-variant text-[14px] leading-[1.5]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST SECTION ───────────────────────────────────────────────────────── */
function TrustSection() {
  const ref = useFadeIn() as React.RefObject<HTMLDivElement>;
  const personas = ['FOUNDERS', 'INVESTORS', 'CONSULTANTS', 'STRATEGISTS', 'ANALYSTS'];

  return (
    <section ref={ref} className="py-32 fade-in-scroll">
      <div className="max-w-container-max mx-auto px-margin-desktop text-center">
        <p className="text-[12px] font-[500] leading-[1] tracking-[0.05em] uppercase tracking-[0.2em] text-outline mb-12">
          Trusted by builders at the world&rsquo;s most aggressive organizations
        </p>
        <div className="flex flex-wrap justify-center gap-x-20 gap-y-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {personas.map((p) => (
            <span key={p} className="text-[32px] font-semibold leading-[1.2] tracking-[-0.02em]">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ────────────────────────────────────────────────────────────── */
function CtaSection() {
  const ref = useFadeIn() as React.RefObject<HTMLDivElement>;

  return (
    <section ref={ref} className="py-40 relative overflow-hidden fade-in-scroll">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="max-w-container-max mx-auto px-margin-desktop text-center relative z-10">
        <h2 className="text-[48px] font-[700] leading-[1.1] tracking-[-0.04em] mb-8 max-w-3xl mx-auto leading-tight">
          Start seeing tomorrow&rsquo;s market before everyone else.
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link
            href="/add"
            className="bg-primary text-on-primary font-bold px-12 py-5 rounded-full text-[12px] font-[500] tracking-[0.05em] hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <Zap size={16} /> Launch MarketAutopsy
          </Link>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Shield size={16} className="text-primary" />
            <span className="text-[14px] leading-[1.5]">Enterprise ready. GDPR compliant.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── DARK FOOTER ──────────────────────────────────────────────────────────── */
function DarkFooter() {
  return (
    <footer className="w-full py-16 border-t border-white/5 bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
        <div>
          <span className="text-[24px] font-semibold leading-[1.3] tracking-[-0.01em] text-primary block mb-4">MarketAutopsy</span>
          <p className="text-[14px] leading-[1.5] text-on-surface-variant max-w-sm">&copy; 2026 MarketAutopsy AI. Enterprise Intelligence Operating System.</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
          {['Privacy Policy', 'Terms of Service', 'Security', 'API Documentation', 'Contact Sales'].map((label) => (
            <a key={label} href="#" className="text-on-surface-variant hover:text-primary transition-colors text-[14px] leading-[1.5]">{label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT EXPORT ──────────────────────────────────────────────────────────── */
export function Hero() {
  return (
    <div className="dark-page bg-background text-on-surface">
      <DarkNav />
      <HeroSection />
      <WorkflowSection />
      <CoreEnginesSection />
      <TrustSection />
      <CtaSection />
      <DarkFooter />
    </div>
  );
}
