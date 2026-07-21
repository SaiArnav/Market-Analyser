'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, UserPlus, User } from 'lucide-react';

type UserInfo = { id: string; email: string } | null;

export function DarkTopNav() {
  const [user, setUser] = useState<UserInfo>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(data => {
        setUser(data);
        setChecked(true);
      })
      .catch(() => {
        setUser(null);
        setChecked(true);
      });
  }, []);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-container-max rounded-full border border-white/10 bg-surface/80 backdrop-blur-3xl shadow-2xl z-50 flex justify-between items-center px-8 py-3">
      <div className="flex items-center gap-12">
        <Link href="/" className="text-[24px] font-semibold tracking-tighter text-on-surface">MarketAutopsy</Link>
        <div className="hidden md:flex gap-8">
          <Link href="/dashboard" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">Dashboard</Link>
          <Link href="/opportunities" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">Opportunities</Link>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
        {!checked ? (
          <div className="h-8 w-20 rounded-full bg-white/5 animate-pulse" />
        ) : user ? (
          <>
            <Link href="/account" className="text-on-surface-variant font-medium hover:text-on-surface transition-colors text-[12px] font-[500] tracking-[0.05em]">
              Account
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-white/10">
              <User size={13} className="text-primary" />
              <span className="text-[11px] font-mono text-on-surface-variant">{user.email}</span>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-on-surface-variant hover:text-on-surface border border-white/10 hover:border-white/20 transition-all">
              <LogIn size={13} />
              Login
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-primary text-on-primary border border-primary/40 transition-all hover:opacity-90">
              <UserPlus size={13} />
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
