'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';

type TgUser = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
};

type Post = PostCardData;

export default function PostsPage() {
  const router = useRouter();
  const tgUser = useSignal(initData.user);
  const viewer = useMemo<TgUser | null>(
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/posts${viewer?.id ? `?userId=${encodeURIComponent(viewer.id)}` : ''}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load posts');
      }

      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [viewer?.id]);

  // Refresh only pending posts without reloading the entire feed
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
          return data.post as Post;
        })
      );

      // Update only the posts that changed
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
    void loadPosts();
  }, [loadPosts]);

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

  const handleOpenModel = (modelId: string) => {
    router.push(`/models/${encodeURIComponent(modelId)}`);
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

      // Remove from local state
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

      const data = await response.json();

      // Update local state
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, is_published: isPublished } : post))
      );
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
          // padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        }}
      >

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
          <Section header="Nothing here yet">
            <div style={{ padding: '12px' }}>
              <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
                Your generated projects will appear here.
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
