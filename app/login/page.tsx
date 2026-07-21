'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import { DarkTopNav } from '@/components/ui/DarkTopNav';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await r.json();
      setLoading(false);
      if (!r.ok) {
        setError(json.detail || 'Login failed.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setLoading(false);
      setError('Failed to connect to the server.');
    }
  }

  return (
    <div className="dark-page bg-background text-on-surface min-h-screen">
      <DarkTopNav />

      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-medium tracking-[0.08em] uppercase mb-4">
              WELCOME BACK
            </div>
            <h1 className="text-[clamp(28px,4vw,36px)] font-[800] tracking-[-0.04em] text-on-surface mb-2 leading-[1.1]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Sign in to your account
            </h1>
            <p className="text-on-surface-variant text-[14px] leading-[1.6] m-0">
              Access your market intelligence dashboard.
            </p>
          </div>

          <form onSubmit={submit} className="glass-panel p-7 rounded-2xl grid gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-on-surface-variant">
                Email <span className="text-primary">*</span>
              </span>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-surface-container-low border border-white/10 text-on-surface outline-none text-[14px] transition-all focus:border-primary/40 focus:bg-surface-container"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-on-surface-variant">
                Password <span className="text-primary">*</span>
              </span>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                <input
                  required
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-surface-container-low border border-white/10 text-on-surface outline-none text-[14px] transition-all focus:border-primary/40 focus:bg-surface-container"
                />
              </div>
            </label>

            {error && (
              <div className="p-3 rounded-[10px] bg-red-500/10 border border-red-500/25 text-red-400 text-[13.5px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl font-semibold text-[15px] bg-primary text-on-primary border border-primary/40 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed hover:opacity-90"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <LogIn size={16} />}
            </button>
          </form>

          <p className="text-center text-[13px] text-on-surface-variant/60 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
