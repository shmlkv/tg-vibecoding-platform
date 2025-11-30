import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';
import { generateHTMLWithOpenRouter } from '@/lib/openrouter';
import { upsertTelegramUser } from '@/lib/posts';

const EDIT_SYSTEM_PROMPT = `You are an expert Frontend Engineer. You will receive the current HTML code of a mini app/game and a user's edit request.

Your task is to modify the HTML according to the user's request while preserving the overall structure and functionality.

IMPORTANT:
- Keep all existing functionality unless explicitly asked to remove it
- Maintain the same visual style unless asked to change it
- Return ONLY the complete modified HTML code
- Do not include markdown explanations outside the code
- Make sure the result is a complete, working HTML document

OUTPUT: Return the full modified HTML wrapped in <html>...</html>`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;

  try {
    const { editPrompt, user } = await request.json();

    if (!editPrompt || typeof editPrompt !== 'string') {
      return NextResponse.json({ error: 'Edit prompt is required' }, { status: 400 });
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
    }

    const userId = await upsertTelegramUser(user);
    const supabase = getSupabaseClient();

    // Get the post with project
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        model_id,
        project:projects!posts_project_id_fkey (
          id,
          html_content,
          edit_count
        )
      `)
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is the author
    if (String(post.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Only the author can edit this post' }, { status: 403 });
    }

    if (!post.project?.html_content) {
      return NextResponse.json({ error: 'No HTML content to edit' }, { status: 400 });
    }

    // Get API key from user settings or env
    const { data: settings } = await supabase
      .from('user_settings')
      .select('openrouter_api_key')
      .eq('user_id', parseInt(userId, 10))
      .maybeSingle();

    const isFreeMode = process.env.FREE_MODE === 'true';
    const envApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API;
    const modelId = post.model_id || 'x-ai/grok-4.1-fast:free';
    const isFreeModel = modelId.includes(':free');

    // In free mode or for free models, use env key; otherwise use user's key
    const apiKey = (isFreeMode || isFreeModel) ? envApiKey : (settings?.openrouter_api_key || envApiKey);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
    }

    // Create the edit prompt with current HTML
    const fullPrompt = `## User's Edit Request:
${editPrompt}

## Current HTML Code:
\`\`\`html
${post.project.html_content}
\`\`\`

Please modify the HTML according to the user's request above.`;

    const newHtmlContent = await generateHTMLWithOpenRouter({
      prompt: fullPrompt,
      apiKey,
      model: modelId,
      systemPrompt: EDIT_SYSTEM_PROMPT,
    });

    // Update project with new HTML and increment edit_count
    const newEditCount = (post.project.edit_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        html_content: newHtmlContent,
        edit_count: newEditCount,
      })
      .eq('id', post.project.id);

    if (updateError) {
      console.error('[edit] Failed to update project:', updateError);
      return NextResponse.json({ error: 'Failed to save edit' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      html_content: newHtmlContent,
      edit_count: newEditCount,
    });
  } catch (error) {
    console.error('[posts][edit] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Edit failed' },
      { status: 500 }
    );
  }
}
