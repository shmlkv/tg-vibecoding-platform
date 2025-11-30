import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';
import { generateHTMLWithOpenRouter } from '@/lib/openrouter';

const FIX_SYSTEM_PROMPT = `You are an expert Frontend Engineer and debugger. You will receive HTML code that contains JavaScript/runtime errors, along with the error messages.

Your task is to FIX the errors while preserving the original functionality and design.

IMPORTANT RULES:
1. Fix ONLY the specific errors mentioned - do not refactor unrelated code
2. Preserve all existing functionality and visual design
3. If an error is about undefined variables/functions, add proper definitions or imports
4. If an error is about syntax, fix the syntax error
5. If an error is about missing resources, either add a fallback or remove the broken reference
6. Return the COMPLETE fixed HTML document
7. Do not include markdown explanations - return ONLY the HTML code

COMMON FIXES:
- "X is not defined" → Add missing import/definition or use a fallback
- "Cannot read property of undefined" → Add null checks or initialize the variable
- "Unexpected token" → Fix the syntax error
- "Failed to load resource" → Remove or fix the broken resource URL

OUTPUT: Return the complete fixed HTML wrapped in <html>...</html>`;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;

  try {
    const { html, errors, userId } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    if (!errors || typeof errors !== 'string') {
      return NextResponse.json({ error: 'Error description is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Verify post ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id, model_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (String(post.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Only the author can fix this post' }, { status: 403 });
    }

    // Get API key
    const { data: settings } = await supabase
      .from('user_settings')
      .select('openrouter_api_key')
      .eq('user_id', userId)
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

    // Create the fix prompt
    const fixPrompt = `## Errors to Fix:
${errors}

## Current HTML Code (with errors):
\`\`\`html
${html}
\`\`\`

Please fix all the errors listed above and return the corrected HTML code.`;

    console.log(`[fix] Fixing errors for post ${postId} with model ${modelId}`);
    console.log(`[fix] Errors:\n${errors.substring(0, 500)}...`);

    const fixedHtml = await generateHTMLWithOpenRouter({
      prompt: fixPrompt,
      apiKey,
      model: modelId,
      systemPrompt: FIX_SYSTEM_PROMPT,
    });

    console.log(`[fix] Fixed HTML generated, length: ${fixedHtml.length}`);

    return NextResponse.json({
      success: true,
      fixedHtml,
    });
  } catch (error) {
    console.error('[posts][fix] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fix failed' },
      { status: 500 }
    );
  }
}
