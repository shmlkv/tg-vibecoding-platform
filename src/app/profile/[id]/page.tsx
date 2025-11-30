'use client';

import { initData, shareURL, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { PostCard, type PostCardData, type UserSummary } from '@/components/PostCard';
import { TabNavigation } from '@/components/TabNavigation';


type ProfileStats = {
  totalPosts: number;
  joinedAt?: string;
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;

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
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setError('User not found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register current viewer if logged in
      if (viewer?.id) {
        await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(viewer),
        });
      }

      const query = new URLSearchParams();
      if (viewer?.id) {
        query.set('userId', viewer.id);
      }
      query.set('authorId', profileId);

      const [userRes, postsRes] = await Promise.all([
        fetch(`/api/users/${encodeURIComponent(profileId)}`),
        fetch(`/api/posts?${query.toString()}`),
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
  }, [profileId, viewer]);

  // Refresh only pending posts without reloading the entire profile
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

  const handleOpenAuthor = (userId: string) => {
    if (userId !== profileId) {
      router.push(`/profile/${userId}`);
    }
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

  const name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    (profile.username ? `@${profile.username}` : 'Telegram user')
    : 'Profile';

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
        <Section header="Profile">
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Avatar size={96} src={profile?.photo_url || undefined} acronym={name.slice(0, 2)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <Text weight="2" style={{ fontSize: '20px' }}>
                  {name}
                </Text>
                <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                  {stats.totalPosts} {stats.totalPosts === 1 ? 'post' : 'posts'}
                </Text>
                {stats.joinedAt && (
                  <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '13px' }}>
                    Joined {new Date(stats.joinedAt).toLocaleDateString()}
                  </Text>
                )}
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={() => {
                const botLink = process.env.NEXT_PUBLIC_BOT_LINK || 'GoldHourBot';
                const botApp = process.env.NEXT_PUBLIC_BOT_APP || 'bot';
                const shareUrl = `https://t.me/${botLink}/${botApp}?startapp=user_${profileId}`;
                const shareText = `Check out ${name}'s profile`;

                try {
                  if (shareURL.isAvailable()) {
                    shareURL(shareUrl, shareText);
                  } else if (navigator.share) {
                    navigator.share({
                      title: `${name}'s Profile`,
                      text: shareText,
                      url: shareUrl,
                    });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    alert('Profile link copied to clipboard!');
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
              Share Profile
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
                This user has not published posts yet.
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
