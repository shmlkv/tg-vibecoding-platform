'use client';

import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Page } from '@/components/Page';

type PostResponse = {
  post: {
    id: string;
    v0_demo_url: string;
    title: string;
    prompt: string;
    status?: 'pending' | 'ready' | 'failed';
    generation_error?: string | null;
  };
};

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const directUrl = searchParams.get('url');
  const [url, setUrl] = useState<string | null>(directUrl);
  const [status, setStatus] = useState<'pending' | 'ready' | 'failed' | null>(
    directUrl ? 'ready' : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId && !directUrl) {
      setIsLoading(false);
    }
    if (directUrl) {
      setIsLoading(false);
    }
  }, [postId, directUrl]);

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data: PostResponse = await response.json();
      if (!response.ok) {
        throw new Error((data as unknown as { error?: string }).error || 'Не удалось загрузить');
      }
      setUrl(data.post.v0_demo_url);
      setStatus(data.post.status ?? 'ready');
      if (data.post.status === 'failed' && data.post.generation_error) {
        setError(data.post.generation_error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить пост');
      setStatus((prev) => prev ?? 'failed');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    void fetchPost();
  }, [postId, fetchPost]);

  useEffect(() => {
    if (!postId) return undefined;
    if (status !== 'pending') return undefined;

    const interval = setInterval(() => {
      void fetchPost();
    }, 5000);

    return () => clearInterval(interval);
  }, [status, postId, fetchPost]);

  if (!url && !isLoading && status !== 'pending') {
    return (
      <Page>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            color: 'var(--tg-theme-hint-color)',
          }}
        >
          <Text>{error ?? 'Нет ссылки для превью'}</Text>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--tg-theme-bg-color, #fff)',
        }}
      >
        {(isLoading || status === 'pending') && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Spinner size="l" />

            {status === 'pending' && (
              <Text style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center' }}>
                We saved your post. The live demo appears automatically once ready.
              </Text>
            )}
          </div>
        )}
        {status === 'failed' && !isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              color: '#991b1b',
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              width: '80%',
              maxWidth: '360px',
            }}
          >
            <Text weight="2">Generation failed</Text>
            <Text style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center' }}>
              {error || 'Please try generating again.'}
            </Text>
          </div>
        )}
        {url && status !== 'pending' && (
          <iframe
            src={url}
            onLoad={() => setIsLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: isLoading ? 'none' : 'block',
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </Page>
  );
}
