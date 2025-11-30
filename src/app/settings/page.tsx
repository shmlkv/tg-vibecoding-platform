'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Input, Text } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';
import type { UserSettings } from '@/lib/supabase/types';

type Viewer = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export default function SettingsPage() {
  const tgUser = useSignal(initData.user);
  const viewer = useMemo<Viewer | null>(
    () =>
      tgUser
        ? {
          id: String(tgUser.id),
          username: tgUser.username ?? undefined,
          first_name: tgUser.first_name ?? undefined,
          last_name: tgUser.last_name ?? undefined,
        }
        : null,
    [tgUser]
  );

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!viewer) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings?userId=${encodeURIComponent(viewer.id)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load settings');
      }

      setSettings(data.settings);
      setApiKey(data.settings.openrouter_api_key || '');
      setCustomModel(data.settings.custom_model || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [viewer]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!viewer) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: viewer.id,
          openrouterApiKey: apiKey.trim() || null,
          customModel: customModel.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSettings(data.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!viewer) {
    return (
      <Page>
        <div style={{ padding: '16px' }}>
          <Text>Please sign in to access settings</Text>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: 'var(--tg-theme-text-color)',
            }}
          >
            Settings
          </h1>
          <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
            Configure your OpenRouter API key to use paid models
          </Text>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '10px',
              border: '1px solid #fecdd3',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
            }}
          >
            Settings saved successfully!
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <Text>Loading settings...</Text>
          </div>
        ) : (
          <>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'var(--tg-theme-text-color)',
                }}
              >
                OpenRouter API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--tg-theme-hint-color)',
                  backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                  color: 'var(--tg-theme-text-color)',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              />
              <Text
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '12px',
                  color: 'var(--tg-theme-hint-color)',
                }}
              >
                Get your API key from{' '}
                <a
                  href="https://openrouter.ai/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'underline' }}
                >
                  openrouter.ai/settings/keys
                </a>
              </Text>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'var(--tg-theme-text-color)',
                }}
              >
                Custom Model (optional)
              </label>
              <Input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. anthropic/claude-3.5-sonnet"
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--tg-theme-hint-color)',
                  backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                  color: 'var(--tg-theme-text-color)',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                }}
              />
              <Text
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '12px',
                  color: 'var(--tg-theme-hint-color)',
                }}
              >
                Enter any OpenRouter model ID. This will appear as &quot;Custom&quot; in the model selector.{' '}
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'underline' }}
                >
                  Browse models
                </a>
              </Text>
            </div>

            <div
              style={{
                padding: '12px',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                border: '1px solid #a7f3d0',
              }}
            >
              <Text style={{ fontSize: '14px', color: '#065f46' }}>
                Without an API key you can use free models (Grok, Gemini, Llama, Qwen). Add a key to unlock all models.
              </Text>
            </div>

            <Button
              size="l"
              stretched
              onClick={handleSave}
              disabled={isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>

            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                borderRadius: '8px',
                border: '1px solid var(--tg-theme-hint-color)',
              }}
            >
              <Text style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                Your API key is stored securely and never shared.
              </Text>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
