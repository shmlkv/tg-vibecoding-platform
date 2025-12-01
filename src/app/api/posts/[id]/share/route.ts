import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type TelegramResult = {
  ok: boolean;
  result?: {
    prepared_message_id: string;
  };
  description?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    const supabase = getSupabaseClient();

    // Get post details
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, prompt, project:projects(id, html_content)')
      .eq('id', params.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Build the share URL
    const botLink = process.env.NEXT_PUBLIC_BOT_LINK || 'GoldHourBot';
    const botApp = process.env.NEXT_PUBLIC_BOT_APP || 'bot';
    const shareUrl = `https://t.me/${botLink}/${botApp}?startapp=post_${post.id}`;

    // Prepare inline message using Bot API
    // https://core.telegram.org/bots/api#savepreparedinlinemessage
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: Number(userId),
          result: {
            type: 'article',
            id: `post_${post.id}`,
            title: post.title || 'Check out this project',
            description: post.prompt?.slice(0, 100) || 'A project created with AI',
            input_message_content: {
              message_text: `🚀 ${post.prompt}\n\n👉 ${shareUrl}`,
              parse_mode: 'HTML',
            },
            url: shareUrl,
          },
          allow_user_chats: true,
          allow_bot_chats: true,
          allow_group_chats: true,
          allow_channel_chats: true,
        }),
      }
    );

    const data: TelegramResult = await response.json();

    if (!data.ok || !data.result) {
      console.error('[share] Telegram API error:', data);
      return NextResponse.json(
        { error: data.description || 'Failed to prepare share message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preparedMessageId: data.result.prepared_message_id,
    });
  } catch (error) {
    console.error('[share] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare share' },
      { status: 500 }
    );
  }
}
