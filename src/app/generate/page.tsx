'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Combobox, ComboboxOption } from '@/components/Combobox';
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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert AVAILABLE_MODELS to ComboboxOption format
  const modelOptions: ComboboxOption[] = useMemo(
    () =>
      AVAILABLE_MODELS.map((model) => ({
        value: model.id,
        label: model.name,
      })),
    []
  );

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

  const isFreeModel = selectedModel.includes(':free');
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
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: title.trim() || undefined,
          user: viewer,
          model: selectedModel,
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

  const currentModelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

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
              AI Model{' '}
              <a
                href="https://openrouter.ai/models?order=top-weekly"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--tg-theme-hint-color)', opacity: 0.7 }}
              >
                (list)
              </a>
            </Text>
            <Combobox
              options={modelOptions}
              value={selectedModel}
              onChange={setSelectedModel}
              placeholder="Select model..."
              searchPlaceholder="Search or enter model ID..."
              disabled={isLoading || isLoadingSettings}
              allowCustom={true}
              customLabel="Use custom model:"
            />
          </div>

          {/* FREE_MODE indicator */}
          {isFreeMode && (
            <div
              style={{
                padding: '10px 12px',
                background: 'transparent',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
              }}
            >
              <Text
                weight="2"
                style={{
                  fontSize: '13px',
                  color: 'var(--tg-theme-text-color)',
                  marginBottom: '2px',
                  display: 'block',
                }}
              >
                ✨ Free during beta test
              </Text>
              <Text style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                You can add OpenRouter key in Settings later
              </Text>
            </div>
          )}

          {/* Warning if API key needed */}
          {!isLoadingSettings && needsApiKey && (
            <div
              style={{
                padding: '10px 12px',
                background: 'transparent',
                borderRadius: '12px',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              <Text
                weight="2"
                style={{
                  fontSize: '13px',
                  color: 'var(--tg-theme-text-color)',
                  marginBottom: '2px',
                  display: 'block',
                }}
              >
                ⚠️ High load detected
              </Text>
              <Text style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                Please add your OpenRouter API key in{' '}
                <span
                  onClick={() => router.push('/settings')}
                  style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--tg-theme-link-color, #3390ec)' }}
                >
                  Settings
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
            {isLoading ? 'Generating…' : 'Generate'}
          </Button>

        </div>
      </div>
      <TabNavigation />
    </Page>
  );
}
