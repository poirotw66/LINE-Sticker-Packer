import React, { useEffect, useState } from 'react';
import { X, Key, Loader2 } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey ? '••••••••••••' : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(apiKey ? '••••••••••••' : '');
      setMessage(null);
    }
  }, [isOpen, apiKey]);

  const handleSave = () => {
    setSaving(true);
    setMessage(null);
    try {
      const raw = inputValue.trim();
      if (raw === '••••••••••••' && apiKey) {
        setMessage({ type: 'success', text: 'Key unchanged.' });
      } else if (raw) {
        setApiKey(raw);
        setInputValue('••••••••••••');
        setMessage({ type: 'success', text: 'API key saved. It is stored only in this browser.' });
      } else {
        clearApiKey();
        setInputValue('');
        setMessage({ type: 'success', text: 'API key cleared.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
    setMessage({ type: 'success', text: 'API key cleared.' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="settings-title" className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Used for AI-generated sticker title and description. Get your key at{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google AI Studio
              </a>
              . Stored only in this browser (localStorage).
            </p>
            <input
              id="api-key-input"
              type="password"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
            {hasApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                Clear key
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
