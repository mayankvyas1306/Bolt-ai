// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  const { user } = await req.json();
  
  // Fix: Call cookies() and assign it to a variable first.
  const cookieStore = cookies();

  // Use the variable to set the cookie
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });
  
  return NextResponse.json({ success: true });
}

export async function GET(req) {
  // Fix: Call cookies() and assign it to a variable first.
  const cookieStore = cookies();
  
  // Use the variable to get the cookie
  const session = cookieStore.get('session');
  
  if (!session) {
    return NextResponse.json({ user: null });
  }
  
  return NextResponse.json({ user: JSON.parse(session.value) });
}