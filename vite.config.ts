import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.AZURE_ENDPOINT': JSON.stringify(env.AZURE_ENDPOINT),
        'process.env.AZURE_MODEL_NAME': JSON.stringify(env.AZURE_MODEL_NAME),
        'process.env.AZURE_API_KEY': JSON.stringify(env.AZURE_API_KEY),
        'process.env.AZURE_OPENAI_API_KEY': JSON.stringify(env.AZURE_OPENAI_API_KEY),
        'process.env.AZURE_OPENAI_ENDPOINT': JSON.stringify(env.AZURE_OPENAI_ENDPOINT),
        'process.env.AZURE_TTS_API_KEY': JSON.stringify(env.AZURE_TTS_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
