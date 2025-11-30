'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import { TabNavigation } from '@/components/TabNavigation';
import { AVAILABLE_MODELS } from '@/lib/openrouter';

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
  const [selectedModel, setSelectedModel] = useState('x-ai/grok-4.1-fast:free');
  const [customModel, setCustomModel] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's API key status from settings
  const loadSettings = useCallback(async () => {
    if (!viewer?.id) {
      setIsLoadingSettings(false);
      return;
    }

    try {
      const response = await fetch(`/api/settings?userId=${encodeURIComponent(viewer.id)}`);
      const data = await response.json();

      if (response.ok && data.settings) {
        setHasApiKey(Boolean(data.settings.openrouter_api_key));
        setCustomModel(data.settings.custom_model || null);
      }
    } catch {
      // Ignore errors, use default
    } finally {
      setIsLoadingSettings(false);
    }
  }, [viewer?.id]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const actualModel = selectedModel === 'custom' && customModel ? customModel : selectedModel;
  const isFreeModel = actualModel.includes(':free');
  const needsApiKey = !isFreeModel && !hasApiKey;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const modelToUse = selectedModel === 'custom' && customModel ? customModel : selectedModel;
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: title.trim() || undefined,
          user: viewer,
          model: modelToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      // Redirect to profile to see the new post with auto-refresh
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const currentModelConfig = selectedModel === 'custom' && customModel
    ? { id: customModel, name: `Custom: ${customModel}`, description: 'Your custom model from settings', supportsReasoning: false }
    : AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          overflowX: 'hidden',
        }}
      >
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an idea..."
            disabled={isLoading}
            style={{
              maxWidth: '100%',
              minHeight: '140px',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--tg-theme-hint-color, #ccc)',
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-text-color, #000)',
              fontSize: '16px',
              resize: 'vertical',
              fontFamily: 'monospace',
            }}
          />

          {/* Model selector */}
          <div>
            <Text
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '13px',
                color: 'var(--tg-theme-hint-color)',
              }}
            >
              AI Model
            </Text>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading || isLoadingSettings}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--tg-theme-hint-color, #ccc)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                color: 'var(--tg-theme-text-color, #000)',
                fontSize: '14px',
              }}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.supportsReasoning ? '🧠 ' : ''}{model.name}
                </option>
              ))}
              {customModel && (
                <option value="custom">
                  ⚙️ Custom: {customModel}
                </option>
              )}
            </select>
            {currentModelConfig && (
              <Text
                style={{
                  display: 'block',
                  marginTop: '4px',
                  fontSize: '12px',
                  color: currentModelConfig.supportsReasoning ? '#065f46' : 'var(--tg-theme-hint-color)',
                }}
              >
                {currentModelConfig.supportsReasoning && '🧠 '}{currentModelConfig.description}
              </Text>
            )}
          </div>

          {/* Warning if API key needed */}
          {needsApiKey && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#fef3c7',
                borderRadius: '10px',
                border: '1px solid #fcd34d',
              }}
            >
              <Text style={{ fontSize: '13px', color: '#92400e' }}>
                This model requires an API key.{' '}
                <span
                  onClick={() => router.push('/settings')}
                  style={{ textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Configure in Settings
                </span>
              </Text>
            </div>
          )}
        </div>

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
        <div style={{ paddingLeft: '12px', paddingRight: '12px' }}>

          <Button
            size="l"
            stretched
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim() || needsApiKey}
            loading={isLoading}
          >
            {isLoading ? 'Generating…' : `✨ Generate with ${currentModelConfig?.name.split(': ')[1] || 'AI'}`}
          </Button>

        </div>
      </div>
      <TabNavigation />
    </Page>
  );
}
