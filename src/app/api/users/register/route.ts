import { NextRequest, NextResponse } from 'next/server';

import { upsertTelegramUser, TelegramUserPayload } from '@/lib/posts';

export async function POST(request: NextRequest) {
  try {
    const user: TelegramUserPayload = await request.json();

    if (!user?.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = await upsertTelegramUser(user);

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error('[users][register] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register user' },
      { status: 500 }
    );
  }
}
