'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Avatar, Section, Spinner, Text } from '@telegram-apps/telegram-ui';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!profileId) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
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
    };

    void loadProfile();
  }, [profileId, viewer?.id]);

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

  const handleOpenAuthor = (userId: string) => {
    if (userId !== profileId) {
      router.push(`/profile/${userId}`);
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
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Section header="Profile">
          <div style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Avatar size={64} src={profile?.photo_url || undefined} acronym={name.slice(0, 2)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>Loading profile…</Text>
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
              viewerCanLike={Boolean(viewer)}
              onLike={handleLike}
              likingId={likingId}
              onOpen={handleOpen}
              onOpenAuthor={handleOpenAuthor}
            />
          ))
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
