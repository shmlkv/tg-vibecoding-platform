'use client';

import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Page } from '@/components/Page';
import type { Project } from '@/lib/supabase/types';

export default function ProjectViewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load project');
      }

      setProject(data.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  return (
    <Page>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: 'var(--tg-theme-bg-color)',
        }}
      >
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              margin: '16px',
              borderRadius: '10px',
              border: '1px solid #fecdd3',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              gap: '12px',
              flex: 1,
            }}
          >
            <Spinner size="l" />
          </div>
        ) : project ? (
          <>
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--tg-theme-hint-color)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color)',
              }}
            >
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'var(--tg-theme-text-color)',
                  marginBottom: '4px',
                }}
              >
                {project.title}
              </h1>
              {project.description && (
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--tg-theme-hint-color)',
                  }}
                >
                  {project.description}
                </p>
              )}
            </div>

            <iframe
              srcDoc={project.html_content}
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                backgroundColor: 'white',
              }}
              title={project.title}
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div
            style={{
              padding: '16px',
            }}
          >
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              Project not found.
            </Text>
          </div>
        )}
      </div>
    </Page>
  );
}
