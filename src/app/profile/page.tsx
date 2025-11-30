'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData, type UserSummary } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';

type ProfileStats = {
  totalPosts: number;
  joinedAt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
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
  const [profile, setProfile] = useState<UserSummary | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ totalPosts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!viewer?.id) {
      setIsLoading(false);
      setError('Open inside Telegram to see your profile and posts.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // First, register/upsert user to ensure they exist in DB
      await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(viewer),
      });

      const [userRes, postsRes] = await Promise.all([
        fetch(`/api/users/${viewer.id}`),
        fetch(`/api/posts?userId=${encodeURIComponent(viewer.id)}&authorId=${encodeURIComponent(viewer.id)}`),
      ]);

      const userData = await userRes.json();
      const postsData = await postsRes.json();

      if (!userRes.ok) {
        throw new Error(userData.error || 'Failed to load user profile');
      }
      if (!postsRes.ok) {
        throw new Error(postsData.error || 'Failed to load user posts');
      }

      setProfile(userData.user as UserSummary);
      setPosts(postsData.posts as PostCardData[]);
      setStats({
        totalPosts: (postsData.posts as PostCardData[]).length,
        joinedAt: (userData.user as UserSummary)?.created_at,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [viewer]);

  // Refresh only pending posts without reloading the entire profile
  const refreshPendingPosts = useCallback(async () => {
    const pendingPosts = posts.filter((post) => post.status === 'pending');
    if (pendingPosts.length === 0 || !viewer?.id) return;

    try {
      const updates = await Promise.all(
        pendingPosts.map(async (post) => {
          const response = await fetch(
            `/api/posts/${post.id}?userId=${encodeURIComponent(viewer.id)}`
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
    void loadProfile();
  }, [loadProfile]);

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
    router.push(`/edit/${postId}`);
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
      setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
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

  const handleRetry = async (postId: string, prompt: string) => {
    if (!viewer) return;

    setRetryingId(postId);
    try {
      // Delete the failed post first
      await fetch(`/api/posts/${postId}?userId=${encodeURIComponent(viewer.id)}`, {
        method: 'DELETE',
      });

      // Create a new post with the same prompt
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          user: viewer,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to retry generation');
      }

      // Reload posts to get the new pending post
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry');
    } finally {
      setRetryingId(null);
    }
  };

  const name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    (profile.username ? `@${profile.username}` : 'Telegram user')
    : 'Your profile';

  if (isLoading) {
    return (
      <Page>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Spinner size="l" />
        </div>
        <TabNavigation />
      </Page>
    );
  }

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
        <Section header="Profile">
          <div style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Avatar size={48} src={profile?.photo_url || undefined} acronym={name.slice(0, 2)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Text weight="2" style={{ fontSize: '18px' }}>
                {name}
              </Text>
              <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
                {stats.totalPosts} generated
              </Text>
              {stats.joinedAt && (
                <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Joined {new Date(stats.joinedAt).toLocaleDateString()}
                </Text>
              )}
            </div>
            <button
              onClick={() => router.push('/settings')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--tg-theme-hint-color)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                color: 'var(--tg-theme-text-color)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Settings
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

        {posts.length === 0 ? (
          <Section header="No posts yet">
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
              onOpenModel={handleOpenModel}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onRetry={handleRetry}
              deletingId={deletingId}
              publishingId={publishingId}
              retryingId={retryingId}
            />
          ))
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
