import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Model ID is URL-encoded (e.g., 'anthropic%2Fclaude-opus-4.5')
    const modelId = decodeURIComponent(id);

    const supabase = getSupabaseClient();

    const { data: model, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (error || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Get count of posts for this model
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('model_id', modelId);

    return NextResponse.json({
      model: {
        ...model,
        posts_count: count || 0,
      },
    });
  } catch (error) {
    console.error('[models][GET/:id] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch model' },
      { status: 500 }
    );
  }
}
