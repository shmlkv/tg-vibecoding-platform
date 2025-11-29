'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section, Input, Button, Spinner, Text } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      router.push(`/preview?url=${encodeURIComponent(data.demoUrl)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Section header="Generate UI">
          <div style={{ padding: '12px' }}>
            <Text style={{ marginBottom: '12px', display: 'block' }}>
              Describe the interface you want to create:
            </Text>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A todo list app with dark theme, ability to add and delete tasks..."
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '120px',
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
          </div>
        </Section>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#ff4444', 
            borderRadius: '8px',
            color: 'white',
          }}>
            {error}
          </div>
        )}

        <Button
          size="l"
          stretched
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size="s" />
              <span>Generating... (30-60s)</span>
            </div>
          ) : (
            '✨ Generate UI'
          )}
        </Button>

        {isLoading && (
          <Text style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
            AI is creating your interface. This may take up to a minute.
          </Text>
        )}
      </div>
    </Page>
  );
}
