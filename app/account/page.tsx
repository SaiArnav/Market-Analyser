'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Mail } from 'lucide-react';
import { DarkTopNav } from '@/components/ui/DarkTopNav';

type UserInfo = { id: string; email: string } | null;

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/');
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
              ACCOUNT
            </div>
            <h1 className="text-[clamp(28px,4vw,36px)] font-[800] tracking-[-0.04em] text-on-surface mb-2 leading-[1.1]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Your account
            </h1>
          </div>

          <div className="glass-panel p-7 rounded-2xl">
            {user === undefined ? (
              <div className="text-center py-4">
                <div className="h-4 w-32 bg-white/5 rounded mx-auto animate-pulse" />
              </div>
            ) : user === null ? (
              <div className="text-center py-6">
                <User size={32} className="text-on-surface-variant mx-auto mb-3" />
                <p className="text-on-surface font-semibold text-[16px] mb-1">Not logged in</p>
                <p className="text-on-surface-variant text-[13px] m-0">
                  Sign in to access your account and manage your settings.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                <div className="flex items-center gap-3 p-4 rounded-[10px] bg-surface-container-low border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-on-surface-variant uppercase tracking-[0.05em]">Logged in as</div>
                    <div className="text-[15px] font-semibold text-on-surface">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full py-3.5 px-5 rounded-xl font-semibold text-[15px] bg-red-500/10 text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-80 cursor-pointer disabled:cursor-not-allowed hover:bg-red-500/15"
                >
                  {loggingOut ? 'Signing out...' : 'Logout'}
                  {!loggingOut && <LogOut size={16} />}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
