import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';

function getCookie(req: NextRequest, name: string): string | undefined {
  const cookieHeader = req.headers.get('cookie') || '';
  return cookieHeader.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1];
}

export async function GET(req: NextRequest) {
  const userId = getCookie(req, 'userId');
  if (!userId) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ detail: 'User not found' }, { status: 401 });
  }
  return NextResponse.json({ id: user.id, email: user.email });
}
