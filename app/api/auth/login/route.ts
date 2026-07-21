import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ detail: 'Email and password required' }, { status: 422 });
  }
  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
  }
  const match = await bcrypt.compare(password.trim(), user.password);
  if (!match) {
    return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
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
