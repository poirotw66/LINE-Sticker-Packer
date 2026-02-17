import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // GitHub Pages serves from https://<user>.github.io/<repo-name>/
    const base = process.env.GITHUB_ACTIONS === 'true' ? '/LINE-Sticker-Packer/' : '/';
    return {
      base,
      server: {
        port: 3001,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react';
              if (id.includes('node_modules/jszip')) return 'jszip';
              if (id.includes('node_modules/@google/genai')) return 'genai';
              if (id.includes('node_modules/@dnd-kit')) return 'dnd';
              if (id.includes('node_modules/lucide-react')) return 'lucide';
            },
          },
        },
        chunkSizeWarningLimit: 400,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
