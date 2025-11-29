import { NextRequest, NextResponse } from 'next/server';

import { toggleLike, upsertTelegramUser } from '@/lib/posts';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;

  try {
    const { user } = await request.json();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Telegram user id is required to like a post' },
        { status: 400 }
      );
    }

    const userId = await upsertTelegramUser(user);
    const result = await toggleLike({ postId: params.id, userId });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[posts][like] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update like' },
      { status: 500 }
    );
  }
}
