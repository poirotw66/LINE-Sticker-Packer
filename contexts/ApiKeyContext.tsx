import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_GEMINI_MODEL,
  GeminiChatModelId,
  isGeminiChatModelId,
} from '../constants/geminiModels';
import { GEMINI_API_KEY_STORAGE_KEY, GEMINI_MODEL_STORAGE_KEY } from '../constants/storageKeys';

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

function getStoredModel(): GeminiChatModelId {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_GEMINI_MODEL;
  const raw = window.localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
  if (raw && isGeminiChatModelId(raw)) return raw;
  return DEFAULT_GEMINI_MODEL;
}

interface ApiKeyContextValue {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: boolean;
  geminiModel: GeminiChatModelId;
  setGeminiModel: (model: GeminiChatModelId) => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(getInitialKey);
  const [geminiModel, setGeminiModelState] = useState<GeminiChatModelId>(getStoredModel);

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

  const setGeminiModel = useCallback((model: GeminiChatModelId) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
    }
    setGeminiModelState(model);
  }, []);

  const value = useMemo<ApiKeyContextValue>(
    () => ({
      apiKey,
      setApiKey,
      clearApiKey,
      hasApiKey: !!apiKey,
      geminiModel,
      setGeminiModel,
    }),
    [apiKey, setApiKey, clearApiKey, geminiModel, setGeminiModel]
  );

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKey(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider');
  return ctx;
}
