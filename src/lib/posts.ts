import { getSupabaseClient } from './supabase/client';
import type { Database } from './supabase/types';

export type TelegramUserPayload = {
  id: string | number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  language_code?: string | null;
};

export type PostWithAuthor = Database['public']['Tables']['posts']['Row'] & {
  user: Pick<
    Database['public']['Tables']['users']['Row'],
    'id' | 'username' | 'first_name' | 'last_name' | 'photo_url' | 'created_at'
  > | null;
  liked?: boolean;
};

type PostInsertInput = {
  title: string;
  prompt: string;
  v0ProjectId: string;
  v0ProjectWebUrl?: string | null;
  v0ChatId: string;
  v0DemoUrl: string;
  userId?: string | null;
};

export async function upsertTelegramUser(user: TelegramUserPayload) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('users').upsert(
    {
      id: String(user.id),
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      photo_url: user.photo_url ?? null,
      language_code: user.language_code ?? null,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(`Failed to upsert Telegram user: ${error.message}`);
  }

  return String(user.id);
}

export async function insertPost(input: PostInsertInput): Promise<PostWithAuthor> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: input.title,
      prompt: input.prompt,
      user_id: input.userId ?? null,
      v0_project_id: input.v0ProjectId,
      v0_project_web_url: input.v0ProjectWebUrl ?? null,
      v0_chat_id: input.v0ChatId,
      v0_demo_url: input.v0DemoUrl,
    })
    .select(
      `
      id,
      title,
      prompt,
      likes_count,
      created_at,
      updated_at,
      user_id,
      v0_project_id,
      v0_project_web_url,
      v0_chat_id,
      v0_demo_url,
      user:users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        photo_url
      )
    `
    )
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert post: ${error?.message ?? 'Unknown error'}`);
  }

  return data as PostWithAuthor;
}

export async function getPosts({
  limit = 20,
  viewerId,
  authorId,
}: {
  limit?: number;
  viewerId?: string;
  authorId?: string;
}): Promise<PostWithAuthor[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('posts')
    .select(
      `
        id,
        title,
        prompt,
        likes_count,
        created_at,
        updated_at,
        user_id,
        v0_project_id,
        v0_project_web_url,
        v0_chat_id,
        v0_demo_url,
        user:users!posts_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          photo_url,
          created_at
        )
      `
    )
    .order('created_at', { ascending: false });

  if (authorId) {
    query = query.eq('user_id', authorId);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data) {
    throw new Error(`Failed to fetch posts: ${error?.message ?? 'Unknown error'}`);
  }

  if (!viewerId) {
    return data as PostWithAuthor[];
  }

  const { data: liked } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', viewerId);

  const likedSet = new Set((liked ?? []).map((row) => row.post_id));
  return (data as PostWithAuthor[]).map((post) => ({
    ...post,
    liked: likedSet.has(post.id),
  }));
}

export async function getPostById({
  postId,
  viewerId,
}: {
  postId: string;
  viewerId?: string;
}): Promise<PostWithAuthor | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      prompt,
      likes_count,
      created_at,
      updated_at,
      user_id,
      v0_project_id,
      v0_project_web_url,
      v0_chat_id,
      v0_demo_url,
      user:users!posts_user_id_fkey (
        id,
        username,
        first_name,
        last_name,
        photo_url
      )
    `
    )
    .eq('id', postId)
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch post: ${error?.message ?? 'Unknown error'}`);
  }

  const post = data as PostWithAuthor;

  if (viewerId) {
    const { data: liked } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', viewerId)
      .maybeSingle();

    post.liked = Boolean(liked);
  }

  return post;
}

export async function toggleLike({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = getSupabaseClient();

  const { data: postExists, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .maybeSingle();

  if (postError && postError.code !== 'PGRST116') {
    throw new Error(`Failed to verify post: ${postError.message}`);
  }

  if (!postExists) {
    throw new Error('Post not found');
  }

  const { data: existing, error: existingError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw new Error(`Failed to check like: ${existingError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) {
      throw new Error(`Failed to remove like: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: userId,
    });
    if (error) {
      throw new Error(`Failed to add like: ${error.message}`);
    }
  }

  const { data: post, error: countError } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single();

  if (countError || !post) {
    throw new Error(`Failed to refresh likes count: ${countError?.message ?? 'Unknown error'}`);
  }

  return {
    liked: !existing,
    likesCount: post.likes_count,
  };
}
