'use client';

import { initData, useSignal } from '@telegram-apps/sdk-react';
import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Page } from '@/components/Page';

type PostData = {
  id: string;
  title: string;
  prompt: string;
  model_id?: string;
  project?: {
    id: number;
    html_content: string;
    edit_count: number;
  } | null;
};

export default function EditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');

  const tgUser = useSignal(initData.user);
  const viewer = useMemo(
    () =>
      tgUser
        ? {
            id: String(tgUser.id),
            username: tgUser.username ?? undefined,
            first_name: tgUser.first_name ?? undefined,
            last_name: tgUser.last_name ?? undefined,
            photo_url: tgUser.photo_url ?? undefined,
          }
        : null,
    [tgUser]
  );

  const [post, setPost] = useState<PostData | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [editPrompt, setEditPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
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
      setHtmlContent(data.post.project?.html_content || null);
      setEditCount(data.post.project?.edit_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  const handleEdit = async () => {
    if (!postId || !viewer || !editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editPrompt: editPrompt.trim(),
          user: viewer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Edit failed');
      }

      // Update local state with new HTML
      setHtmlContent(data.html_content);
      setEditCount(data.edit_count);
      setEditPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit failed');
    } finally {
      setIsEditing(false);
    }
  };

  if (!postId) {
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
          <Text>No post ID provided</Text>
        </div>
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '12px',
          }}
        >
          <Spinner size="l" />
          <Text style={{ color: 'var(--tg-theme-hint-color)' }}>Loading...</Text>
        </div>
      </Page>
    );
  }

  if (!post || !htmlContent) {
    return (
      <Page>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            gap: '12px',
            padding: '20px',
          }}
        >
          <Text style={{ color: '#991b1b' }}>
            {error || 'No content available to edit'}
          </Text>
          <Button size="s" mode="outline" onClick={() => router.back()}>
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
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--tg-theme-bg-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
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
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <Text weight="2">Edit Project</Text>
          </div>
          <div
            style={{
              padding: '4px 10px',
              backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              borderRadius: '12px',
            }}
          >
            <Text style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)' }}>
              {editCount} edits
            </Text>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isEditing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                zIndex: 10,
              }}
            >
              <Spinner size="l" />
              <Text style={{ color: '#ffffff' }}>Applying changes...</Text>
            </div>
          )}
          <iframe
            key={htmlContent.length}
            srcDoc={htmlContent}
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>

        {/* Edit Input */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--tg-theme-hint-color)',
            backgroundColor: 'var(--tg-theme-bg-color)',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {error && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Describe your changes... (e.g., 'Make the button blue', 'Add a score counter')"
              disabled={isEditing}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--tg-theme-hint-color)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
                color: 'var(--tg-theme-text-color)',
                fontSize: '15px',
                resize: 'none',
                minHeight: '48px',
                maxHeight: '120px',
                fontFamily: 'inherit',
              }}
              rows={2}
            />
            <Button
              size="m"
              mode="filled"
              onClick={handleEdit}
              disabled={isEditing || !editPrompt.trim()}
              loading={isEditing}
              style={{
                alignSelf: 'flex-end',
                minWidth: '70px',
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
