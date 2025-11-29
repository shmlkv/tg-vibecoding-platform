import { NextRequest, NextResponse } from 'next/server';

import { insertPost, upsertTelegramUser, getPosts } from '@/lib/posts';
import { createV0Chat, createV0Project } from '@/lib/v0';

function buildTitle(prompt: string, customTitle?: string) {
  const trimmed = customTitle?.trim();
  if (trimmed) return trimmed.slice(0, 120);

  const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
  return cleanPrompt.length > 90 ? `${cleanPrompt.slice(0, 90)}…` : cleanPrompt;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get('userId') ?? undefined;
  const authorId = searchParams.get('authorId') ?? undefined;

  try {
    const posts = await getPosts({
      limit: 30,
      viewerId: viewerId ?? undefined,
      authorId: authorId ?? undefined,
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[posts][GET] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, title, user } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let userId: string | null = null;
    if (user?.id) {
      userId = await upsertTelegramUser(user);
    }

    const computedTitle = buildTitle(prompt, title);
    const project = await createV0Project({
      name: computedTitle,
      description: prompt.slice(0, 280),
    });

    const { chat, demoUrl } = await createV0Chat({
      prompt,
      projectId: project.id,
    });

    const post = await insertPost({
      title: computedTitle,
      prompt,
      userId,
      v0ProjectId: project.id,
      v0ProjectWebUrl: project.webUrl ?? null,
      v0ChatId: chat.id,
      v0DemoUrl: demoUrl,
    });

    return NextResponse.json({
      post,
      demoUrl,
      projectUrl: project.webUrl ?? project.apiUrl ?? null,
    });
  } catch (error) {
    console.error('[posts][POST] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
