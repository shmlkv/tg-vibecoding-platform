import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await context.params;

  try {
    const { html, userId } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Get post with project
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        project_id,
        project:projects!posts_project_id_fkey (
          id,
          edit_count
        )
      `)
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify ownership
    if (String(post.user_id) !== String(userId)) {
      return NextResponse.json({ error: 'Only the author can save changes' }, { status: 403 });
    }

    if (!post.project_id || !post.project) {
      return NextResponse.json({ error: 'Post has no associated project' }, { status: 400 });
    }

    // Update project HTML
    const newEditCount = ((post.project as { edit_count?: number }).edit_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        html_content: html,
        edit_count: newEditCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.project_id);

    if (updateError) {
      console.error('[save] Failed to update project:', updateError);
      return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
    }

    console.log(`[save] Saved changes for post ${postId}, edit_count: ${newEditCount}`);

    return NextResponse.json({
      success: true,
      edit_count: newEditCount,
    });
  } catch (error) {
    console.error('[posts][save] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}
