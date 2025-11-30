import { NextResponse } from 'next/server';

export async function GET() {
  const isFreeMode = process.env.FREE_MODE === 'true';
  return NextResponse.json({ isFreeMode });
}
