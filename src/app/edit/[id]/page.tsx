'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Page } from '@/components/Page';
import { useIframeDebug, type DebugMessage } from '@/hooks/useIframeDebug';
import { wrapHtmlWithErrorCapture } from '@/lib/iframe-debug';
import { wrapHtmlWithMute } from '@/lib/iframe-mute';

type PostData = {
  id: string;
  title: string;
  prompt: string;
  project?: {
    id: number;
    title: string;
    html_content: string;
  } | null;
};

type Viewer = {
  id: string;
  username?: string | null;
  first_name?: string | null;
};

export default function EditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id;

  const tgUser = useSignal(initData.user);
  const viewer = useMemo<Viewer | null>(
    () =>
      tgUser
        ? {
            id: String(tgUser.id),
            username: tgUser.username ?? undefined,
            first_name: tgUser.first_name ?? undefined,
          }
        : null,
    [tgUser]
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { errors, logs, isReady, hasErrors, clear, getErrorsSummary } = useIframeDebug();

  const [post, setPost] = useState<PostData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'errors' | 'console' | 'chat'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load post data
  const loadPost = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load post');
      }

      setPost(data.post);
      if (data.post.project?.html_content) {
        setHtmlContent(data.post.project.html_content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  // Clear debug when HTML changes
  useEffect(() => {
    clear();
  }, [htmlContent, clear]);

  // Fix errors with AI
  const handleFixErrors = async () => {
    if (!hasErrors || !htmlContent || !postId) return;

    setIsFixing(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          errors: getErrorsSummary(),
          userId: viewer?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix errors');
      }

      setHtmlContent(data.fixedHtml);
      setSuccessMessage('Errors fixed! Review the changes.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix errors');
    } finally {
      setIsFixing(false);
    }
  };

  // Edit with AI chat
  const handleEditWithAI = async () => {
    if (!chatInput.trim() || !htmlContent || !postId || !viewer) return;

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editPrompt: chatInput.trim(),
          user: {
            id: viewer.id,
            username: viewer.username,
            first_name: viewer.first_name,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit');
      }

      setHtmlContent(data.html_content);
      setChatInput('');
      setSuccessMessage('Updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload post to get updated edit_count
      void loadPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit');
    } finally {
      setIsEditing(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!postId || !htmlContent || !viewer) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          userId: viewer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSuccessMessage('Saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Wrapped HTML for preview
  const wrappedHtml = useMemo(() => {
    if (!htmlContent) return '';
    // First wrap with mute script, then with error capture
    const mutedHtml = wrapHtmlWithMute(htmlContent);
    return wrapHtmlWithErrorCapture(mutedHtml);
  }, [htmlContent]);

  if (isLoading) {
    return (
      <Page>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '12px',
          }}
        >
          <Spinner size="l" />
          <Text>Loading...</Text>
        </div>
      </Page>
    );
  }

  if (!post || !htmlContent) {
    return (
      <Page>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
            {error || 'Post not found or has no generated content'}
          </Text>
          <Button size="m" mode="outline" onClick={() => router.back()} style={{ marginTop: '16px' }}>
            Go Back
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--tg-theme-hint-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text weight="2" style={{ fontSize: '16px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.title || 'Edit Post'}
            </Text>
          </div>
          <Button size="s" mode="outline" onClick={handleSave} loading={isSaving} disabled={isSaving}>
            Save
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontSize: '14px',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Preview */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            minHeight: 0,
            borderBottom: '1px solid var(--tg-theme-hint-color)',
          }}
        >
          {wrappedHtml ? (
            <iframe
              ref={iframeRef}
              srcDoc={wrappedHtml}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--tg-theme-hint-color)',
              }}
            >
              No preview available
            </div>
          )}
          {!isReady && wrappedHtml && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
              }}
            >
              <Spinner size="l" />
            </div>
          )}
        </div>

        {/* Debug Panel */}
        <div
          style={{
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            backgroundColor: 'var(--tg-theme-secondary-bg-color)',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--tg-theme-hint-color)',
            }}
          >
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: activeTab === 'chat' ? 'var(--tg-theme-bg-color)' : 'transparent',
                color: activeTab === 'chat' ? '#3b82f6' : 'var(--tg-theme-text-color)',
                fontWeight: activeTab === 'chat' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              💬 Edit
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: activeTab === 'errors' ? 'var(--tg-theme-bg-color)' : 'transparent',
                color: activeTab === 'errors' ? '#ef4444' : 'var(--tg-theme-text-color)',
                fontWeight: activeTab === 'errors' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Errors {errors.length > 0 && `(${errors.length})`}
            </button>
            <button
              onClick={() => setActiveTab('console')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: activeTab === 'console' ? 'var(--tg-theme-bg-color)' : 'transparent',
                color: 'var(--tg-theme-text-color)',
                fontWeight: activeTab === 'console' ? '600' : '400',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Console {logs.length > 0 && `(${logs.length})`}
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px',
              fontFamily: activeTab === 'chat' ? 'inherit' : 'monospace',
              fontSize: activeTab === 'chat' ? '14px' : '12px',
            }}
          >
            {activeTab === 'chat' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tell me what to change... (e.g., 'make the background blue', 'add a button that says Hello')"
                    disabled={isEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handleEditWithAI();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid var(--tg-theme-hint-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--tg-theme-bg-color)',
                      color: 'var(--tg-theme-text-color)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                  <Button
                    size="m"
                    stretched
                    onClick={handleEditWithAI}
                    loading={isEditing}
                    disabled={isEditing || !chatInput.trim()}
                  >
                    {isEditing ? 'Editing...' : 'Edit with AI'}
                  </Button>
                </div>
              </div>
            ) : activeTab === 'errors' ? (
              errors.length === 0 ? (
                <div style={{ color: '#10b981', padding: '8px' }}>No errors</div>
              ) : (
                errors.map((err, i) => (
                  <ErrorItem key={i} error={err} />
                ))
              )
            ) : logs.length === 0 ? (
              <div style={{ color: 'var(--tg-theme-hint-color)', padding: '8px' }}>No logs yet</div>
            ) : (
              logs.map((log, i) => (
                <LogItem key={i} log={log} />
              ))
            )}
          </div>

          {/* Fix Button */}
          {hasErrors && (
            <div style={{ padding: '8px', borderTop: '1px solid var(--tg-theme-hint-color)' }}>
              <Button
                size="m"
                stretched
                onClick={handleFixErrors}
                loading={isFixing}
                disabled={isFixing}
                style={{ backgroundColor: '#ef4444' }}
              >
                Fix {errors.length} Error{errors.length > 1 ? 's' : ''} with AI
              </Button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

function ErrorItem({ error }: { error: DebugMessage }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        marginBottom: '4px',
        backgroundColor: '#fef2f2',
        borderRadius: '4px',
        borderLeft: '3px solid #ef4444',
      }}
    >
      <div style={{ color: '#991b1b', fontWeight: '600' }}>
        {error.category || 'Error'}
        {error.line && ` (line ${error.line})`}
      </div>
      <div style={{ color: '#7f1d1d', marginTop: '2px' }}>{error.message}</div>
      {error.stack && (
        <details style={{ marginTop: '4px' }}>
          <summary style={{ color: '#b91c1c', cursor: 'pointer', fontSize: '11px' }}>Stack trace</summary>
          <pre
            style={{
              margin: '4px 0 0',
              padding: '4px',
              backgroundColor: '#fee2e2',
              borderRadius: '2px',
              overflow: 'auto',
              fontSize: '10px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

function LogItem({ log }: { log: DebugMessage }) {
  const levelColors: Record<string, string> = {
    log: '#6b7280',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    debug: '#8b5cf6',
  };

  const color = levelColors[log.level || 'log'] || '#6b7280';

  return (
    <div
      style={{
        padding: '4px 8px',
        marginBottom: '2px',
        display: 'flex',
        gap: '8px',
        borderLeft: `2px solid ${color}`,
      }}
    >
      <span style={{ color, fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', minWidth: '40px' }}>
        {log.level}
      </span>
      <span style={{ color: 'var(--tg-theme-text-color)', flex: 1 }}>
        {log.args?.map((arg, i) => (
          <span key={i}>
            {typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}
            {i < (log.args?.length || 0) - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </div>
  );
}
