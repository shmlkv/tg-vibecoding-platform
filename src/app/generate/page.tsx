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
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4.5');
  const [customModel, setCustomModel] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's API key status and FREE_MODE from settings
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

      // Check FREE_MODE from env
      const freeModeResponse = await fetch('/api/free-mode');
      const freeModeData = await freeModeResponse.json();
      if (freeModeResponse.ok) {
        setIsFreeMode(freeModeData.isFreeMode);
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
  const needsApiKey = !isFreeMode && !isFreeModel && !hasApiKey;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Show toast if API key is needed
    if (needsApiKey) {
      setError('Please configure your OpenRouter API key in Settings or use a free model');
      setTimeout(() => setError(null), 5000);
      return;
    }

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
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
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

          {/* FREE_MODE indicator */}
          {isFreeMode && (
            <div
              style={{
                padding: '14px 16px',
                background: 'transparent',
                borderRadius: '14px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  lineHeight: '1',
                }}
              >
                ✨
              </div>
              <div style={{ flex: 1 }}>
                <Text
                  weight="2"
                  style={{
                    fontSize: '14px',
                    color: 'var(--tg-theme-text-color)',
                    marginBottom: '2px',
                    display: 'block',
                  }}
                >
                  Free during beta test
                </Text>
                <Text style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                  You can add OpenRouter key in Settings later
                </Text>
              </div>
            </div>
          )}

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
              position: 'fixed',
              bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
              left: '12px',
              right: '12px',
              padding: '12px 16px',
              backgroundColor: '#dc2626',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style jsx>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
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
