import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ detail: 'Email and password required' }, { status: 422 });
  }
  const existing = await getUserByEmail(email.trim().toLowerCase());
  if (existing) {
    return NextResponse.json({ detail: 'Email already registered' }, { status: 409 });
  }
  const user = await createUser(email.trim().toLowerCase(), password.trim());
  if (!user) {
    return NextResponse.json({ detail: 'Failed to create user' }, { status: 500 });
  }
  const res = NextResponse.json({ id: user.id, email: user.email });
  res.cookies.set('userId', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
