'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData, type UserSummary } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openTelegramLink?: (url: string) => void;
      };
    };
  }
}

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
  const getProviderEmoji = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('anthropic')) return '🤖';
    if (p.includes('openai')) return '🧠';
    if (p.includes('x-ai') || p.includes('xai')) return '✨';
    if (p.includes('google')) return '🔮';
    return '🤖';
  };

  return (
    <Page>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: 'calc(258px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Section header="AI Model">
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: model?.is_free ? '#d1fae5' : '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  flexShrink: 0,
                }}
              >
                {model ? getProviderEmoji(model.provider) : '🤖'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <Text weight="2" style={{ fontSize: '20px' }}>
                  {model?.name || 'Loading...'}
                </Text>
                <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                  {model?.provider}
                  {model?.is_free && (
                    <span
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      FREE
                    </span>
                  )}
                </Text>
                {model?.description && (
                  <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '13px' }}>
                    {model.description}
                  </Text>
                )}
                <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                  {model?.posts_count || 0} {model?.posts_count === 1 ? 'post' : 'posts'} generated
                </Text>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={async () => {
                const shareUrl = `${window.location.origin}/models/${encodeURIComponent(modelId || '')}`;
                const shareText = `Check out ${model?.name || 'this AI model'}`;

                try {
                  if (window.Telegram?.WebApp?.openTelegramLink) {
                    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                    window.Telegram.WebApp.openTelegramLink(tgShareUrl);
                  } else if (navigator.share) {
                    await navigator.share({
                      title: `${model?.name || 'AI Model'} Profile`,
                      text: shareText,
                      url: shareUrl,
                    });
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Model profile link copied to clipboard!');
                  }
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--tg-theme-hint-color, #dbdbdb)',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--tg-theme-text-color)',
                transition: 'background-color 0.1s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--tg-theme-secondary-bg-color, #f5f5f5)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
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
        </Section>

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
          <Section header="No posts yet">
            <div style={{ padding: '12px' }}>
              <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
                No posts have been generated with this model yet.
              </Text>
            </div>
          </Section>
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
