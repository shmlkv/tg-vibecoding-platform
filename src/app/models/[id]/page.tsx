'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { shareURL } from '@telegram-apps/sdk';
import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData, type UserSummary } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';

type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  avatar_url: string | null;
  is_free: boolean;
  posts_count: number;
  created_at: string;
};

export default function ModelProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const modelId = Array.isArray(params?.id)
    ? decodeURIComponent(params.id[0])
    : params?.id
      ? decodeURIComponent(params.id)
      : null;

  const tgUser = useSignal(initData.user);
  const viewer = useMemo<UserSummary | null>(
    () =>
      tgUser
        ? {
          id: String(tgUser.id),
          username: tgUser.username ?? undefined,
          first_name: tgUser.first_name ?? undefined,
          last_name: tgUser.last_name ?? undefined,
          photo_url: tgUser.photo_url ?? undefined,
        }
        : null,
    [tgUser]
  );

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadModelProfile = useCallback(async () => {
    if (!modelId) {
      setError('Model not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const encodedModelId = encodeURIComponent(modelId);
      const query = new URLSearchParams();
      if (viewer?.id) {
        query.set('userId', viewer.id);
      }
      query.set('modelId', modelId);

      const [modelRes, postsRes] = await Promise.all([
        fetch(`/api/models/${encodedModelId}`),
        fetch(`/api/posts?${query.toString()}`),
      ]);

      const modelData = await modelRes.json();
      const postsData = await postsRes.json();

      if (!modelRes.ok) {
        throw new Error(modelData.error || 'Failed to load model profile');
      }

      if (!postsRes.ok) {
        throw new Error(postsData.error || 'Failed to load model posts');
      }

      setModel(modelData.model as ModelInfo);
      setPosts(postsData.posts as PostCardData[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model profile');
    } finally {
      setIsLoading(false);
    }
  }, [modelId, viewer?.id]);

  // Refresh only pending posts without reloading the entire model profile
  const refreshPendingPosts = useCallback(async () => {
    const pendingPosts = posts.filter((post) => post.status === 'pending');
    if (pendingPosts.length === 0) return;

    try {
      const updates = await Promise.all(
        pendingPosts.map(async (post) => {
          const response = await fetch(
            `/api/posts/${post.id}${viewer?.id ? `?userId=${encodeURIComponent(viewer.id)}` : ''}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          return data.post as PostCardData;
        })
      );

      setPosts((prev) =>
        prev.map((post) => {
          const updated = updates.find((u) => u?.id === post.id);
          return updated || post;
        })
      );
    } catch {
      // Silently fail - will retry on next interval
    }
  }, [posts, viewer?.id]);

  useEffect(() => {
    void loadModelProfile();
  }, [loadModelProfile]);

  useEffect(() => {
    if (!posts.some((post) => post.status === 'pending')) {
      return undefined;
    }

    const interval = setInterval(() => {
      void refreshPendingPosts();
    }, 3000);

    return () => clearInterval(interval);
  }, [posts, refreshPendingPosts]);

  const handleLike = async (postId: string) => {
    if (!viewer) {
      setError('Sign in via Telegram Mini App to like posts.');
      return;
    }

    setLikingId(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: viewer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like');
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, liked: data.liked, likes_count: data.likesCount }
            : post
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like');
    } finally {
      setLikingId(null);
    }
  };

  const handleOpen = (postId: string) => {
    router.push(`/preview?postId=${postId}`);
  };

  const handleEdit = (postId: string) => {
    router.push(`/edit?postId=${postId}`);
  };

  const handleOpenAuthor = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleOpenModel = (modelIdToOpen: string) => {
    // Don't navigate if it's the same model
    if (modelIdToOpen !== modelId) {
      router.push(`/models/${encodeURIComponent(modelIdToOpen)}`);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!viewer) return;

    setDeletingId(postId);
    try {
      const response = await fetch(
        `/api/posts/${postId}?userId=${encodeURIComponent(viewer.id)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (postId: string, isPublished: boolean) => {
    if (!viewer) return;

    setPublishingId(postId);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: viewer.id, is_published: isPublished }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
      }

      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, is_published: isPublished } : post))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setPublishingId(null);
    }
  };

  // Provider emoji/icon
  const getProviderEmoji = () => {
    return '🤖';
  };

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: 'calc(258px + env(safe-area-inset-bottom, 0px))',
          overflowX: 'hidden',
        }}
      >
        {/* Model Header */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Top row: Avatar + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Model Avatar */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                backgroundColor: model?.is_free ? '#d1fae5' : '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '42px',
                flexShrink: 0,
              }}
            >
              {getProviderEmoji()}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <Text weight="1" style={{ fontSize: '18px', display: 'block' }}>
                  {model?.posts_count || 0}
                </Text>
                <Text style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)' }}>
                  posts
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text weight="1" style={{ fontSize: '18px', display: 'block' }}>
                  {totalLikes}
                </Text>
                <Text style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)' }}>
                  likes
                </Text>
              </div>
            </div>
          </div>

          {/* Name + Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Text weight="2" style={{ fontSize: '16px' }}>
              {model?.name || 'Loading...'}
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
              {model?.provider}
            </Text>
            {model?.description && (
              <Text style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                {model.description}
              </Text>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={async () => {
              const botLink = process.env.NEXT_PUBLIC_BOT_LINK || 'GoldHourBot';
              const botApp = process.env.NEXT_PUBLIC_BOT_APP || 'bot';
              // Base64 encode model ID for URL safety (handles slashes and special chars)
              const encodedModelId = btoa(modelId || '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              const url = `https://t.me/${botLink}/${botApp}?startapp=model_${encodedModelId}`;
              const text = `Check out ${model?.name || 'this AI model'}`;

              try {
                // Try native Telegram shareURL first
                const shared = shareURL.ifAvailable(url, text);
                if (shared !== undefined) return;

                // Fallbacks
                if (navigator.share) {
                  await navigator.share({
                    title: `${model?.name || 'AI Model'} Profile`,
                    text,
                    url,
                  });
                } else {
                  await navigator.clipboard.writeText(url);
                  alert('Model profile link copied to clipboard!');
                }
              } catch (err) {
                console.error('Error sharing:', err);
              }
            }}
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
              color: 'var(--tg-theme-button-text-color, #fff)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            Share Model
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '10px',
              border: '1px solid #fecdd3',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              gap: '12px',
            }}
          >
            <Spinner size="l" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              No posts have been generated with this model yet.
            </Text>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={viewer?.id}
              viewerCanLike={Boolean(viewer)}
              onLike={handleLike}
              likingId={likingId}
              onOpen={handleOpen}
              onEdit={handleEdit}
              onOpenAuthor={handleOpenAuthor}
              onOpenModel={handleOpenModel}
              onDelete={handleDelete}
              onPublish={handlePublish}
              deletingId={deletingId}
              publishingId={publishingId}
            />
          ))
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
