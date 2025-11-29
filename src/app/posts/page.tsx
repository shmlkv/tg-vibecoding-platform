'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Section, Spinner, Text } from '@telegram-apps/telegram-ui';

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
  const [error, setError] = useState<string | null>(null);

  const loadPosts = async () => {
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
  };

  useEffect(() => {
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer?.id]);

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

  return (
    <Page>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '80px',
        }}
      >
        <Section header="Project feed">
          <div style={{ padding: '12px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <Text weight="2">
              Generate UI with v0 and embed live previews inside posts. Fresh drops appear below.
            </Text>
            <Button mode="filled" stretched size="l" onClick={() => router.push('/generate')}>
              ✨ Create a new post
            </Button>
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
          <Text style={{ color: 'var(--tg-theme-hint-color)' }}>Loading posts…</Text>
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
              viewerCanLike={Boolean(viewer)}
              onLike={handleLike}
              likingId={likingId}
              onOpen={handleOpen}
            />
          ))
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
