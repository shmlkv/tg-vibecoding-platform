'use client';

import { wrapHtmlWithMute } from '@/lib/iframe-mute';
import { Avatar, Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState } from 'react';

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

export type UserSummary = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  created_at?: string;
};

export type ModelSummary = {
  id: string;
  name: string;
  provider: string;
  avatar_url?: string | null;
  is_free: boolean;
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
  is_published?: boolean;
  model?: ModelSummary | null;
  project?: {
    id: string;
    title: string;
    html_content: string;
    edit_count?: number;
  } | null;
};

export type PostCardProps = {
  post: PostCardData;
  viewerId?: string | null;
  viewerCanLike: boolean;
  onLike: (postId: string) => Promise<void>;
  likingId: string | null;
  onOpen: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onOpenAuthor?: (userId: string) => void;
  onOpenModel?: (modelId: string) => void;
  onDelete?: (postId: string) => Promise<void>;
  onPublish?: (postId: string, isPublished: boolean) => Promise<void>;
  onRetry?: (postId: string, prompt: string) => Promise<void>;
  deletingId?: string | null;
  publishingId?: string | null;
  retryingId?: string | null;
};

function getErrorInfo(error?: string | null): { title: string; message: string; icon: string } {
  if (!error) {
    return { title: 'Generation failed', message: 'Unknown error occurred', icon: '❌' };
  }

  const lowerError = error.toLowerCase();

  if (lowerError.includes('abort') || lowerError.includes('cancel')) {
    return { title: 'Generation cancelled', message: 'The request was cancelled', icon: '🚫' };
  }
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return { title: 'Request timeout', message: 'Generation took too long. Try a simpler prompt.', icon: '⏱️' };
  }
  if (lowerError.includes('rate limit') || lowerError.includes('429')) {
    return { title: 'Rate limited', message: 'Too many requests. Please wait a moment.', icon: '🚦' };
  }
  if (lowerError.includes('api key') || lowerError.includes('unauthorized') || lowerError.includes('401')) {
    return { title: 'API key error', message: 'Check your API key in Settings', icon: '🔑' };
  }
  if (lowerError.includes('insufficient') || lowerError.includes('credits') || lowerError.includes('balance')) {
    return { title: 'Insufficient credits', message: 'Add credits to your OpenRouter account', icon: '💳' };
  }
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return { title: 'Network error', message: 'Check your internet connection', icon: '📡' };
  }

  return { title: 'Generation failed', message: error.slice(0, 150), icon: '❌' };
}

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

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PostCard({
  post,
  viewerId,
  viewerCanLike,
  onLike,
  likingId,
  onOpen,
  onEdit,
  onOpenAuthor,
  onOpenModel,
  onDelete,
  onPublish,
  onRetry,
  deletingId,
  publishingId,
  retryingId,
}: PostCardProps) {
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const hasHtmlContent = Boolean(post.project?.html_content);
  const hasV0Demo = Boolean(post.v0_demo_url && post.v0_demo_url !== 'pending' && post.v0_demo_url !== 'failed');
  const isGenerating = post.status === 'pending' || post.v0_demo_url === 'pending';
  const isFailed = post.status === 'failed' || post.v0_demo_url === 'failed';
  const isAuthor = viewerId && post.user?.id && String(viewerId) === String(post.user.id);
  const isPublished = post.is_published ?? true; // Old posts without this field are considered published

  useEffect(() => {
    setIsFrameLoading(true);
  }, [post.v0_demo_url, post.project?.html_content]);

  const canOpenAuthor = Boolean(onOpenAuthor && post.user?.id);
  const canOpenModel = Boolean(onOpenModel && post.model?.id);

  // Wrap HTML content with mute script
  const mutedHtmlContent = useMemo(() => {
    if (!post.project?.html_content) return null;
    return wrapHtmlWithMute(post.project.html_content);
  }, [post.project?.html_content]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: '0', marginBottom: '4px', backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: canOpenAuthor ? 'pointer' : 'default',
            flex: 1,
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
            {post.model && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (canOpenModel && post.model?.id) {
                    onOpenModel?.(post.model.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: canOpenModel ? 'pointer' : 'default',
                }}
              >
                <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '13px' }}>
                  via
                </Text>
                <Text weight="2" style={{ fontSize: '13px', color: 'var(--tg-theme-link-color, #3b82f6)' }}>
                  {post.model.name}
                </Text>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthor && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              disabled={deletingId === post.id}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: deletingId === post.id ? 'not-allowed' : 'pointer',
                opacity: deletingId === post.id ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--tg-theme-hint-color, #9ca3af)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
              borderRadius: '12px',
              padding: '20px',
              margin: '20px',
              maxWidth: '300px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text weight="1" style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
              Delete post?
            </Text>
            <Text style={{ color: 'var(--tg-theme-hint-color)', marginBottom: '16px', display: 'block' }}>
              This action cannot be undone.
            </Text>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                size="s"
                mode="plain"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="s"
                mode="filled"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.(post.id);
                }}
                disabled={deletingId === post.id}
                loading={deletingId === post.id}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: 'none',
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #fafafa)',
          aspectRatio: '1',
          width: '100%',
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
              height: '100%',
            }}
          >
            <Spinner size="l" />
            <Text weight="2">Generating UI…</Text>
            <Text style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center' }}>
              This usually takes around 3-5 minutes.<br />The card will refresh once ready.
            </Text>
          </div>
        ) : isFailed ? (
          (() => {
            const errorInfo = getErrorInfo(post.generation_error);
            const isRetrying = retryingId === post.id;
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '24px',
                  height: '100%',
                  backgroundColor: '#fef2f2',
                }}
              >
                <span style={{ fontSize: '32px' }}>{errorInfo.icon}</span>
                <Text weight="2" style={{ color: '#991b1b', fontSize: '16px' }}>
                  {errorInfo.title}
                </Text>
                <Text style={{ color: '#7f1d1d', textAlign: 'center', fontSize: '14px' }}>
                  {errorInfo.message}
                </Text>
                {isAuthor && onRetry && (
                  <Button
                    size="s"
                    mode="filled"
                    onClick={() => onRetry(post.id, post.prompt)}
                    disabled={isRetrying}
                    loading={isRetrying}
                    style={{
                      marginTop: '8px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                    }}
                  >
                    {isRetrying ? 'Retrying…' : '🔄 Retry'}
                  </Button>
                )}
              </div>
            );
          })()
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
            {hasHtmlContent && mutedHtmlContent ? (
              <iframe
                srcDoc={mutedHtmlContent}
                title={post.title}
                onLoad={() => setIsFrameLoading(false)}
                onError={() => setIsFrameLoading(false)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  border: 'none',
                  display: 'block',
                  opacity: isFrameLoading ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              />
            ) : hasV0Demo ? (
              <iframe
                src={post.v0_demo_url}
                title={post.title}
                onLoad={() => setIsFrameLoading(false)}
                onError={() => setIsFrameLoading(false)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  border: 'none',
                  display: 'block',
                  opacity: isFrameLoading ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              />
            ) : null}
          </>
        )}
      </div>
      <div style={{ paddingTop: '8px', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
        {/* Instagram-style action buttons */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
          {/* Like button */}
          <button
            onClick={() => {
              if (!post.liked) {
                setLikeAnimation(true);
                setTimeout(() => setLikeAnimation(false), 600);
              }
              onLike(post.id);
            }}
            disabled={!viewerCanLike || likingId === post.id || isGenerating || isFailed}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: viewerCanLike && likingId !== post.id && !isGenerating && !isFailed ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '24px',
              opacity: !viewerCanLike || likingId === post.id || isGenerating || isFailed ? 0.5 : 1,
              position: 'relative',
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: likeAnimation ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                filter: post.liked ? 'drop-shadow(0 0 4px rgba(255, 23, 68, 0.4))' : 'none',
              }}
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill={post.liked ? '#ff1744' : 'none'}
                stroke={post.liked ? 'none' : 'var(--tg-theme-text-color)'}
                strokeWidth={post.liked ? '0' : '2'}
                style={{
                  transition: 'none',
                }}
              />
            </svg>
            {/* Animation particles */}
            {likeAnimation && (
              <>
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#ff1744',
                      transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-20px)`,
                      opacity: 0,
                      animation: `likeParticle 0.6s ease-out`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}
              </>
            )}
          </button>
          <style>{`
            @keyframes likeParticle {
              0% {
                opacity: 1;
                transform: translate(-50%, -50%) rotate(${0}deg) translateY(0px) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) rotate(${0}deg) translateY(-30px) scale(0);
              }
            }
          `}</style>

          {/* Share button - for author when they have controls */}
          {isAuthor && !isGenerating && !isFailed && (
            <button
              onClick={async () => {
                const botLink = process.env.NEXT_PUBLIC_BOT_LINK || 'GoldHourBot';
                const botApp = process.env.NEXT_PUBLIC_BOT_APP || 'bot';
                const shareUrl = `https://t.me/${botLink}/${botApp}?startapp=post_${post.id}`;
                const shareText = `Check out this project: ${post.prompt}`;

                try {
                  // Try Telegram share first
                  if (window.Telegram?.WebApp?.openTelegramLink) {
                    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                    window.Telegram.WebApp.openTelegramLink(tgShareUrl);
                  } else if (navigator.share) {
                    // Fallback to Web Share API
                    await navigator.share({
                      title: post.title,
                      text: shareText,
                      url: shareUrl,
                    });
                  } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard!');
                  }
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '24px',
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--tg-theme-text-color)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          )}

          {/* Open button */}
          <button
            onClick={() => onOpen(post.id)}
            disabled={isGenerating || isFailed}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: isGenerating || isFailed ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              opacity: isGenerating || isFailed ? 0.5 : 1,
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--tg-theme-text-color)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>

          {/* Share button - moves to right if NOT author or no controls */}
          {(!isAuthor || isGenerating || isFailed) && (
            <button
              onClick={async () => {
                const botLink = process.env.NEXT_PUBLIC_BOT_LINK || 'GoldHourBot';
                const botApp = process.env.NEXT_PUBLIC_BOT_APP || 'bot';
                const shareUrl = `https://t.me/${botLink}/${botApp}?startapp=post_${post.id}`;
                const shareText = `Check out this project: ${post.prompt}`;

                try {
                  // Try Telegram share first
                  if (window.Telegram?.WebApp?.openTelegramLink) {
                    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                    window.Telegram.WebApp.openTelegramLink(tgShareUrl);
                  } else if (navigator.share) {
                    // Fallback to Web Share API
                    await navigator.share({
                      title: post.title,
                      text: shareText,
                      url: shareUrl,
                    });
                  } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard!');
                  }
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              }}
              disabled={isGenerating || isFailed}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isGenerating || isFailed ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '24px',
                opacity: isGenerating || isFailed ? 0.5 : 1,
                transition: 'transform 0.1s ease',
                marginLeft: 'auto',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--tg-theme-text-color)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          )}

          {/* Author controls on the right */}
          <div style={{ marginLeft: isAuthor && !isGenerating && !isFailed ? 'auto' : '0', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Edit button - only for author with HTML content */}
            {isAuthor && hasHtmlContent && onEdit && !isGenerating && !isFailed && (
              <Button size="s" mode="plain" onClick={() => onEdit(post.id)} style={{ fontSize: '13px', padding: '4px 8px' }}>
                Edit{post.project?.edit_count ? ` (${post.project.edit_count})` : ''}
              </Button>
            )}

            {/* Publish button for unpublished posts by author */}
            {isAuthor && !isPublished && onPublish && !isGenerating && !isFailed && (
              <Button
                size="s"
                mode="filled"
                onClick={() => onPublish(post.id, true)}
                disabled={publishingId === post.id}
                loading={publishingId === post.id}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '4px 12px',
                }}
              >
                ✨ Publish
              </Button>
            )}

            {/* Unpublish button for published posts by author */}
            {isAuthor && isPublished && onPublish && !isGenerating && !isFailed && (
              <Button
                size="s"
                mode="plain"
                onClick={() => onPublish(post.id, false)}
                disabled={publishingId === post.id}
                loading={publishingId === post.id}
                style={{ fontSize: '13px', padding: '4px 8px' }}
              >
                Unpublish
              </Button>
            )}
          </div>
        </div>

        {/* Likes count */}
        {post.likes_count > 0 && (
          <Text weight="2" style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
          </Text>
        )}

        {/* Post caption */}
        <Text style={{ color: 'var(--tg-theme-text-color)', fontSize: '14px' }}>
          {post.prompt}
        </Text>

        {/* Timestamp */}
        <Text style={{ color: 'var(--tg-theme-hint-color)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
          {formatShortDate(post.created_at)}
        </Text>
      </div>
    </div>
  );
}
