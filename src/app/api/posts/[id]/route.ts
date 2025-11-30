import { NextRequest, NextResponse } from 'next/server';

import { getPostById } from '@/lib/posts';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

// DELETE post (only by author)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // First check if the post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete the post
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', params.id);

    if (deleteError) {
      console.error('[posts][DELETE] error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[posts][DELETE] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PATCH post (publish/unpublish)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { userId, is_published } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'is_published must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // First check if the post belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.user_id !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'You can only modify your own posts' },
        { status: 403 }
      );
    }

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ is_published })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('[posts][PATCH] error:', updateError);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('[posts][PATCH] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    );
  }
}
