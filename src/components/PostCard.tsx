'use client';

import { useState } from 'react';
import { Avatar, Button, Section, Spinner, Text } from '@telegram-apps/telegram-ui';

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

export function PostCard({ post, viewerCanLike, onLike, likingId, onOpen }: PostCardProps) {
  const [isFrameLoading, setIsFrameLoading] = useState(true);

  return (
    <Section key={post.id} header={post.title}>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--tg-theme-hint-color, #d1d5db)',
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #f9fafb)',
            minHeight: 280,
          }}
        >
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
              <Text style={{ color: 'var(--tg-theme-hint-color)' }}>Loading preview…</Text>
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
              backgroundColor: 'var(--tg-theme-bg-color, #fff)',
            }}
          />
        </div>

        <Text style={{ color: 'var(--tg-theme-text-color)' }}>{post.prompt}</Text>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            size="s"
            mode={post.liked ? 'filled' : 'bezeled'}
            disabled={!viewerCanLike || likingId === post.id}
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
    </Section>
  );
}
