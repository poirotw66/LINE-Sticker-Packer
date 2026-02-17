import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { GEMINI_API_KEY_STORAGE_KEY } from '../constants/storageKeys';

function getStoredKey(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
}

function getBuildTimeKey(): string | null {
  const key = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY;
  if (key) return key;
  const fallback = typeof process !== 'undefined' && process.env?.API_KEY;
  return fallback || null;
}

function getInitialKey(): string | null {
  return getStoredKey() || getBuildTimeKey() || null;
}

interface ApiKeyContextValue {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(getInitialKey);

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (typeof window !== 'undefined' && window.localStorage) {
      if (trimmed) {
        window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
      }
    }
    setApiKeyState(trimmed || null);
  }, []);

  const clearApiKey = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
    setApiKeyState(null);
  }, []);

  const value = useMemo<ApiKeyContextValue>(
    () => ({
      apiKey,
      setApiKey,
      clearApiKey,
      hasApiKey: !!apiKey,
    }),
    [apiKey, setApiKey, clearApiKey]
  );

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider');
  return ctx;
}
