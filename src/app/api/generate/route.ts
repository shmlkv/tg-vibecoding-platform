import { NextRequest, NextResponse } from 'next/server';

import { createV0Chat, createV0Project } from '@/lib/v0';

function buildTitle(prompt: string) {
  const cleanPrompt = prompt.replace(/\s+/g, ' ').trim();
  return cleanPrompt.length > 90 ? `${cleanPrompt.slice(0, 90)}…` : cleanPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const project = await createV0Project({
      name: buildTitle(prompt),
      description: prompt.slice(0, 280),
    });

    const { chat, demoUrl } = await createV0Chat({
      prompt,
      projectId: project.id,
    });

    return NextResponse.json({
      demoUrl,
      chatId: chat.id,
      projectId: project.id,
      projectUrl: project.webUrl ?? project.apiUrl ?? null,
    });
  } catch (error) {
    console.error('[v0 API] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
