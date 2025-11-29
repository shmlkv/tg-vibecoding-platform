'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spinner } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const [isLoading, setIsLoading] = useState(true);

  if (!url) {
    return (
      <Page>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--tg-theme-hint-color)',
        }}>
          No URL provided
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'var(--tg-theme-bg-color, #fff)' 
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Spinner size="l" />
            <span style={{ color: 'var(--tg-theme-hint-color)' }}>Loading preview...</span>
          </div>
        )}
        <iframe
          src={url}
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: isLoading ? 'none' : 'block',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </Page>
  );
}
