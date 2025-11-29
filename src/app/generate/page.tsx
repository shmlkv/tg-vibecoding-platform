'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Section, Input, Button, Spinner, Text } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';
import { TabNavigation } from '@/components/TabNavigation';

type Viewer = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  language_code?: string | null;
};

export default function GeneratePage() {
  const router = useRouter();
  const tgUser = useSignal(initData.user);
  const viewer = useMemo<Viewer | null>(
    () =>
      tgUser
        ? {
            id: String(tgUser.id),
            username: tgUser.username ?? undefined,
            first_name: tgUser.first_name ?? undefined,
            last_name: tgUser.last_name ?? undefined,
            photo_url: tgUser.photo_url ?? undefined,
            language_code: tgUser.language_code ?? undefined,
          }
        : null,
    [tgUser]
  );

  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: title.trim() || undefined,
          user: viewer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      router.push(`/preview?postId=${encodeURIComponent(data.post.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Section header="Create new post">
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short project name (optional)"
              disabled={isLoading}
            />
            <Text style={{ marginBottom: '4px', display: 'block' }}>
              Describe the interface v0 should build:
            </Text>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. CRM dashboard with client cards, filters, light/dark theme, chart."
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '140px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--tg-theme-hint-color, #ccc)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-theme-text-color, #000)',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              We create a v0 project via Platform API, save it in Supabase, and embed the live demo
              into the feed.
            </Text>
          </div>
        </Section>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#ff4444',
              borderRadius: '8px',
              color: 'white',
            }}
          >
            {error}
          </div>
        )}

        <Button
          size="l"
          stretched
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          loading={isLoading}
        >
          {isLoading ? 'Generating and saving…' : '✨ Generate and save'}
        </Button>

        {isLoading && (
          <Text style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
            AI is building your interface. This usually takes under a minute.
          </Text>
        )}
      </div>
      <TabNavigation />
    </Page>
  );
}
