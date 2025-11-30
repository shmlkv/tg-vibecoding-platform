'use client';

import { type PropsWithChildren, useEffect } from 'react';
import {
  initData,
  miniApp,
  useLaunchParams,
  useSignal,
} from '@telegram-apps/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useRouter } from 'next/navigation';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { useDidMount } from '@/hooks/useDidMount';
import { setLocale } from '@/core/i18n/locale';

import './styles.css';

function RootInner({ children }: PropsWithChildren) {
  const lp = useLaunchParams();
  const router = useRouter();

  const isDark = useSignal(miniApp.isDark);
  const initDataUser = useSignal(initData.user);

  // Set the user locale.
  useEffect(() => {
    initDataUser && setLocale(initDataUser.language_code);
  }, [initDataUser]);

  // Handle startParam for deep linking (e.g., model_xxx -> /models/xxx)
  useEffect(() => {
    const startParam = lp.tgWebAppStartParam;
    if (!startParam) return;

    // Helper to decode base64url to original string
    const decodeBase64Url = (str: string): string => {
      try {
        // Convert base64url to base64
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
          base64 += '=';
        }
        return atob(base64);
      } catch {
        return str; // Return original if decode fails
      }
    };

    // Parse the startParam to determine where to navigate
    if (startParam.startsWith('model_')) {
      const encodedModelId = startParam.slice(6); // Remove 'model_' prefix
      const modelId = decodeBase64Url(encodedModelId);
      if (modelId) {
        router.replace(`/models/${encodeURIComponent(modelId)}`);
      }
    } else if (startParam.startsWith('post_')) {
      const postId = startParam.slice(5); // Remove 'post_' prefix
      if (postId) {
        router.replace(`/posts/${postId}`);
      }
    } else if (startParam.startsWith('user_')) {
      const userId = startParam.slice(5); // Remove 'user_' prefix
      if (userId) {
        router.replace(`/profile/${userId}`);
      }
    }
  }, [lp.tgWebAppStartParam, router]);

  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <AppRoot
        className="app-root"
        appearance={isDark ? 'dark' : 'light'}
        platform={
          ['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'
        }
      >
        {children}
      </AppRoot>
    </TonConnectUIProvider>
  );
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of
  // the Server Side Rendering. That's why we are showing loader on the server
  // side.
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : (
    <div className="root__loading">Loading</div>
  );
}
