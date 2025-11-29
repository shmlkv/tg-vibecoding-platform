'use client';

import { Avatar, Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

export type UserSummary = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  created_at?: string;
};

export type PostCardData = {
  id: string;
  title: string;
  prompt: string;
  v0_demo_url: string;
  status?: 'pending' | 'ready' | 'failed';
  generation_error?: string | null;
  likes_count: number;
  liked?: boolean;
  created_at: string;
  user: UserSummary | null;
};

export type PostCardProps = {
  post: PostCardData;
  viewerCanLike: boolean;
  onLike: (postId: string) => Promise<void>;
  likingId: string | null;
  onOpen: (postId: string) => void;
  onOpenAuthor?: (userId: string) => void;
};

function formatName(user?: UserSummary | null) {
  if (!user) return 'Anonymous author';
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  if (fullName) return fullName;
  if (user.username) return `@${user.username}`;
  return 'Telegram user';
}

function makeAcronym(user?: UserSummary | null) {
  if (!user) return 'TG';
  const first = user.first_name?.[0] ?? '';
  const last = user.last_name?.[0] ?? '';
  const username = user.username?.[0] ?? '';
  return (first + last || username || 'TG').slice(0, 2).toUpperCase();
}

export function PostCard({ post, viewerCanLike, onLike, likingId, onOpen, onOpenAuthor }: PostCardProps) {
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  const isGenerating = post.status === 'pending' || post.v0_demo_url === 'pending';
  const isFailed = post.status === 'failed' || post.v0_demo_url === 'failed';

  useEffect(() => {
    setIsFrameLoading(true);
  }, [post.v0_demo_url]);

  const canOpenAuthor = Boolean(onOpenAuthor && post.user?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--tg-theme-hint-color, #d1d5db)', paddingBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: canOpenAuthor ? 'pointer' : 'default',
          padding: '12px',
        }}
        onClick={() => {
          if (canOpenAuthor && post.user?.id) {
            onOpenAuthor?.(post.user.id);
          }
        }}
        role={canOpenAuthor ? 'button' : undefined}
        tabIndex={canOpenAuthor ? 0 : -1}
        onKeyDown={(event) => {
          if (canOpenAuthor && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            const authorId = post.user?.id;
            if (authorId) {
              onOpenAuthor?.(authorId);
            }
          }
        }}
      >
        <Avatar
          size={40}
          src={post.user?.photo_url || undefined}
          acronym={makeAcronym(post.user)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="2">{formatName(post.user)}</Text>
          <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--tg-theme-hint-color, #d1d5db)',
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f9fafb)',
          minHeight: 280,
        }}
      >
        {isGenerating ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '24px',
              minHeight: 280,
            }}
          >
            <Spinner size="l" />
            <Text weight="2">Generating UI on v0…</Text>
            <Text style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center' }}>
              This usually takes under a minute. The card will refresh once ready.
            </Text>
          </div>
        ) : isFailed ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              color: '#991b1b',
              backgroundColor: '#fef2f2',
            }}
          >
            <Text weight="2">Generation failed</Text>
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              {post.generation_error || 'Please retry creating the post.'}
            </Text>
          </div>
        ) : (
          <>
            {isFrameLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background:
                    'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08))',
                }}
              >
                <Spinner size="l" />
              </div>
            )}
            <iframe
              src={post.v0_demo_url}
              title={post.title}
              onLoad={() => setIsFrameLoading(false)}
              onError={() => setIsFrameLoading(false)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: '100%',
                height: 360,
                border: 'none',
                display: 'block',
                opacity: isFrameLoading ? 0 : 1,
                transition: 'opacity 0.2s ease',
                // backgroundColor: 'red',
              }}
            />
          </>
        )}
      </div>
      <div style={{ paddingTop: '6px', paddingLeft: '12px', paddingRight: '12px' }}>
        <Text style={{ color: 'var(--tg-theme-text-color)' }}>{post.prompt}</Text>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '6px' }}>
          <Button
            size="s"
            mode={post.liked ? 'filled' : 'bezeled'}
            disabled={!viewerCanLike || likingId === post.id || isGenerating || isFailed}
            loading={likingId === post.id}
            onClick={() => onLike(post.id)}
            before={<span aria-hidden>❤️</span>}
            after={<span>{post.likes_count}</span>}
          >
            {post.liked ? 'Liked' : 'Like'}
          </Button>
          <Button size="s" mode="outline" onClick={() => onOpen(post.id)}>
            Open full screen
          </Button>
        </div>
      </div>
    </div>
  );
}
