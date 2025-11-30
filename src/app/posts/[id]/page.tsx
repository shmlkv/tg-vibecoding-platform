'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData, type UserSummary } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';

export default function SinglePostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id;

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

  const [post, setPost] = useState<PostCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!postId) {
      setError('Post not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/posts/${postId}${viewer?.id ? `?userId=${encodeURIComponent(viewer.id)}` : ''}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load post');
      }

      setPost(data.post as PostCardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [postId, viewer?.id]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  // Refresh pending post
  useEffect(() => {
    if (!post || post.status !== 'pending') {
      return undefined;
    }

    const interval = setInterval(() => {
      void loadPost();
    }, 3000);

    return () => clearInterval(interval);
  }, [post, loadPost]);

  const handleLike = async (id: string) => {
    if (!viewer) {
      setError('Sign in via Telegram Mini App to like posts.');
      return;
    }

    setLikingId(id);
    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: viewer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like');
      }

      setPost((prev) =>
        prev ? { ...prev, liked: data.liked, likes_count: data.likesCount } : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like');
    } finally {
      setLikingId(null);
    }
  };

  const handleOpen = (id: string) => {
    router.push(`/preview?postId=${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/edit/${id}`);
  };

  const handleOpenAuthor = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleOpenModel = (modelId: string) => {
    router.push(`/models/${encodeURIComponent(modelId)}`);
  };

  const handleDelete = async (id: string) => {
    if (!viewer) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `/api/posts/${id}?userId=${encodeURIComponent(viewer.id)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      // Go back to feed after deleting
      router.push('/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    if (!viewer) return;

    setPublishingId(id);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: viewer.id, is_published: isPublished }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
      }

      setPost((prev) => (prev ? { ...prev, is_published: isPublished } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          overflowX: 'hidden',
        }}
      >
        {error && (
          <div
            style={{
              padding: '12px',
              margin: '12px',
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
              minHeight: '200px',
            }}
          >
            <Spinner size="l" />
          </div>
        ) : !post ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              Post not found
            </Text>
          </div>
        ) : (
          <PostCard
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
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
