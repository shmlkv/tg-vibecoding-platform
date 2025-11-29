import { NextRequest, NextResponse } from 'next/server';

import { getPostById } from '@/lib/posts';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get('userId') ?? undefined;

  try {
    const post = await getPostById({ postId: params.id, viewerId });
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[posts][GET/:id] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
