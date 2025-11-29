'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner, Text } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

type PostResponse = {
  post: {
    id: string;
    v0_demo_url: string;
    title: string;
    prompt: string;
  };
};

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const directUrl = searchParams.get('url');
  const [url, setUrl] = useState<string | null>(directUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId && !directUrl) {
      setIsLoading(false);
    }
  }, [postId, directUrl]);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/posts/${postId}`);
        const data: PostResponse = await response.json();
        if (!response.ok) {
          throw new Error((data as unknown as { error?: string }).error || 'Не удалось загрузить');
        }
        setUrl(data.post.v0_demo_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить пост');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPost();
  }, [postId]);

  if (!url && !isLoading) {
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
        {isLoading && (
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
            <span style={{ color: 'var(--tg-theme-hint-color)' }}>Loading preview...</span>
          </div>
        )}
        {url && (
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
