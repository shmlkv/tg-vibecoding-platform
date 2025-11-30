'use client';

import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Page } from '@/components/Page';
import type { Project } from '@/lib/supabase/types';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects?limit=20');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects');
      }

      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleOpenProject = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <Page back={false}>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: 'var(--tg-theme-text-color)',
          }}
        >
          Projects Gallery
        </h1>

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

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
              gap: '12px',
            }}
          >
            <Spinner size="l" />
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '12px' }}>
            <Text style={{ color: 'var(--tg-theme-hint-color)' }}>
              No projects found.
            </Text>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                style={{
                  background: 'var(--tg-theme-bg-color)',
                  border: '1px solid var(--tg-theme-hint-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: 'var(--tg-theme-text-color)',
                  }}
                >
                  {project.title}
                </h3>
                {project.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--tg-theme-hint-color)',
                      marginBottom: '12px',
                    }}
                  >
                    {project.description}
                  </p>
                )}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--tg-theme-hint-color)',
                  }}
                >
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
