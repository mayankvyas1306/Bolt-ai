// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  const { user } = await req.json();
  
  // Set HTTP-only cookie (not accessible via JavaScript)
  cookies().set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
  
  return NextResponse.json({ success: true });
}

export async function GET(req) {
  const session = cookies().get('session');
  
  if (!session) {
    return NextResponse.json({ user: null });
  }
  
  return NextResponse.json({ user: JSON.parse(session.value) });
}