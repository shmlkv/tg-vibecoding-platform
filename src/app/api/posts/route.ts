import { NextRequest, NextResponse } from 'next/server';

import {
  getPosts,
  insertPost,
  upsertTelegramUser,
  updatePostGenerationFailure,
} from '@/lib/posts';
import { generateHTMLWithOpenRouter, expandPromptWithGrok, AVAILABLE_MODELS } from '@/lib/openrouter';
import { getSupabaseClient } from '@/lib/supabase/client';

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
  const modelId = searchParams.get('modelId') ?? undefined;

  // Only include unpublished posts if viewing own profile
  const isOwnProfile = Boolean(authorId && viewerId && authorId === viewerId);

  try {
    const posts = await getPosts({
      limit: 30,
      viewerId: viewerId ?? undefined,
      authorId: authorId ?? undefined,
      modelId: modelId ?? undefined,
      includeUnpublished: isOwnProfile,
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
    const { prompt, title, user, model: requestedModel } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let userId: string | null = null;
    if (user?.id) {
      userId = await upsertTelegramUser(user);
    }

    // Get user settings to retrieve OpenRouter API key
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication is required for generation' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Use requested model from form, or fall back to user's default, or use free model
    const selectedModel = requestedModel || settings?.selected_model || 'x-ai/grok-4.1-fast:free';
    const isFreeModel = selectedModel === 'x-ai/grok-4.1-fast:free';

    // Use user's API key or fallback to env for free models
    const userApiKey = settings?.openrouter_api_key;
    const envApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API;

    // Only require user API key for non-free models
    if (!isFreeModel && !userApiKey) {
      return NextResponse.json(
        { error: 'Please configure your OpenRouter API key in Settings or use the free xAI model' },
        { status: 400 }
      );
    }

    // For free models, use env key as fallback
    const apiKeyToUse = userApiKey || envApiKey;
    if (!apiKeyToUse) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    // Upsert model info before creating post
    const modelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

    // Extract provider from model id (e.g., 'anthropic/claude-opus-4.5' -> 'Anthropic')
    const providerId = selectedModel.split('/')[0];
    const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);

    // Always upsert the model to ensure it exists
    let validModelId: string | null = null;
    try {
      const { error: modelError } = await supabase.from('models').upsert(
        {
          id: selectedModel,
          name: modelInfo?.name || selectedModel.split('/')[1] || selectedModel,
          provider: providerName,
          description: modelInfo?.description || null,
          is_free: selectedModel.includes(':free'),
        },
        { onConflict: 'id' }
      );

      if (modelError) {
        console.error('[posts][POST] failed to upsert model:', modelError);
      } else {
        // Verify model exists
        const { data: modelCheck } = await supabase
          .from('models')
          .select('id')
          .eq('id', selectedModel)
          .maybeSingle();

        if (modelCheck) {
          validModelId = selectedModel;
        } else {
          console.error('[posts][POST] model not found after upsert:', selectedModel);
        }
      }
    } catch (modelErr) {
      console.error('[posts][POST] exception during model upsert:', modelErr);
    }

    const computedTitle = buildTitle(prompt, title);
    const pendingPost = await insertPost({
      title: computedTitle,
      prompt,
      userId,
      v0ProjectId: null,
      v0ProjectWebUrl: null,
      v0ChatId: null,
      v0DemoUrl: null,
      status: 'pending',
      modelId: validModelId,
    });

    // Generate HTML asynchronously
    void (async () => {
      try {
        // Step 1: Expand the short idea into detailed specification using free Grok
        console.log('[posts][POST] expanding prompt with Grok...');
        const expandedPrompt = await expandPromptWithGrok({
          prompt,
          apiKey: apiKeyToUse,
        });
        console.log('[posts][POST] prompt expanded, length:', expandedPrompt.length);

        // Step 2: Generate HTML with the expanded prompt
        const htmlContent = await generateHTMLWithOpenRouter({
          prompt: expandedPrompt,
          apiKey: apiKeyToUse,
          model: selectedModel,
        });

        // Save to projects table
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: computedTitle,
            description: expandedPrompt,
            html_content: htmlContent,
            user_id: userId ? parseInt(userId) : null,
          })
          .select()
          .single();

        if (projectError || !project) {
          throw new Error(`Failed to save project: ${projectError?.message || 'Unknown error'}`);
        }

        // Update post with project_id and mark as ready
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            project_id: project.id,
            status: 'ready',
            generation_error: null,
          })
          .eq('id', pendingPost.id);

        if (updateError) {
          throw new Error(`Failed to update post: ${updateError.message}`);
        }
      } catch (err) {
        // Detailed error logging
        if (err instanceof Error) {
          console.error('[posts][POST] async generation failed:', {
            name: err.name,
            message: err.message,
            isAbort: err.name === 'AbortError',
            isCancelled: err.message.toLowerCase().includes('abort') || err.message.toLowerCase().includes('cancel'),
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
          });
        } else {
          console.error('[posts][POST] async generation failed with unknown error:', err);
        }

        const message = err instanceof Error ? err.message : 'Generation failed';
        try {
          await updatePostGenerationFailure(pendingPost.id, message);
        } catch (markErr) {
          console.error('[posts][POST] failed to mark post as failed', markErr);
        }
      }
    })();

    return NextResponse.json(
      {
        post: pendingPost,
        status: 'pending',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[posts][POST] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
