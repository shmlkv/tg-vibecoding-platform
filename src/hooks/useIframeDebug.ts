'use client';

import { useCallback, useEffect, useState } from 'react';

export type DebugMessage = {
  type: 'error' | 'resource-error' | 'console' | 'ready' | 'all-errors';
  category?: string;
  level?: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message?: string;
  line?: number;
  column?: number;
  stack?: string | null;
  source?: string;
  tagName?: string;
  args?: unknown[];
  timestamp?: number;
  errors?: DebugMessage[];
  logs?: DebugMessage[];
  errorsCount?: number;
};

export type UseIframeDebugReturn = {
  errors: DebugMessage[];
  logs: DebugMessage[];
  isReady: boolean;
  hasErrors: boolean;
  clear: () => void;
  getErrorsSummary: () => string;
};

export function useIframeDebug(): UseIframeDebugReturn {
  const [errors, setErrors] = useState<DebugMessage[]>([]);
  const [logs, setLogs] = useState<DebugMessage[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.channel !== 'iframe-debug') return;

      const payload = event.data.payload as DebugMessage;

      switch (payload.type) {
        case 'error':
        case 'resource-error':
          setErrors((prev) => [...prev, payload]);
          break;
        case 'console':
          setLogs((prev) => [...prev, payload]);
          // Console.error также добавляем в ошибки
          if (payload.level === 'error') {
            setErrors((prev) => [
              ...prev,
              { ...payload, type: 'error', category: 'ConsoleError' },
            ]);
          }
          break;
        case 'ready':
          setIsReady(true);
          break;
        case 'all-errors':
          if (payload.errors) setErrors(payload.errors);
          if (payload.logs) setLogs(payload.logs);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const clear = useCallback(() => {
    setErrors([]);
    setLogs([]);
    setIsReady(false);
  }, []);

  const getErrorsSummary = useCallback(() => {
    return errors
      .map(
        (e) =>
          `${e.category || 'Error'}: ${e.message}${e.line ? ` (line ${e.line})` : ''}${e.stack ? `\nStack: ${e.stack}` : ''}`
      )
      .join('\n\n');
  }, [errors]);

  return {
    errors,
    logs,
    isReady,
    hasErrors: errors.length > 0,
    clear,
    getErrorsSummary,
  };
}
