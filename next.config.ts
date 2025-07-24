// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AZURE_ENDPOINT: process.env.AZURE_ENDPOINT,
    AZURE_MODEL_NAME: process.env.AZURE_MODEL_NAME,
    AZURE_API_KEY: process.env.AZURE_API_KEY,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_TTS_API_KEY: process.env.AZURE_TTS_API_KEY
  }
};

module.exports = nextConfig;