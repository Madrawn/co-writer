# Copilot Instructions for co-writer

## Project Overview
- **Type:** Next.js app with custom API routes, React components, and LLM (Large Language Model) integration.
- **Major Directories:**
  - `app/` — Next.js app pages, API routes, and UI logic.
  - `components/` — Reusable React components for UI.
  - `lib/` — Core business logic, LLM service wrappers, and utility functions.
  - `hooks/` — Custom React hooks for state and data management.

## Key Architectural Patterns
- **LLM Integration:**
  - LLM requests are routed via `app/api/co-writer/chat/route.ts`.
  - Model selection and prompt building are handled in `lib/llmService.ts` and `lib/promptBuilder.ts`.
  - Supports Azure OpenAI, DeepSeek, and Gemini models; model selection is based on `modelName`.
- **Streaming Responses:**
  - API responses from LLMs are streamed to the frontend using `text/event-stream`.
- **Component Structure:**
  - UI is modularized in `components/` (e.g., `ChatPanel.tsx`, `MessageBubble.tsx`).
  - Styles are colocated as `.css` or `.module.css` files next to components.
- **Testing:**
  - Tests are colocated as `.test.tsx` or `.test.ts` files next to the code under test.
  - Uses Vitest for testing (`vitest.config.ts`).

## Developer Workflows
- **Build:**
  - Standard Next.js build: `npm run build`
- **Dev Server:**
  - Start with `npm run dev` (Next.js hot reload enabled)
- **Test:**
  - Run all tests: `npx vitest`
  - Run a specific test: `npx vitest path/to/file.test.ts[x]`
- **Environment:**
  - Requires Azure/OpenAI API keys in environment variables: `AZURE_API_KEY`, `AZURE_ENDPOINT`, `AZURE_OPENAI_ENDPOINT`.

## Project-Specific Conventions
- **Prompt Construction:**
  - Use `lib/promptBuilder.ts` for all LLM prompt formatting.
- **Model Routing:**
  - Add new LLMs by extending `lib/llmService.ts` and updating API route logic.
- **Error Handling:**
  - API routes return JSON error objects with HTTP status codes for failures.
- **Edge Runtime:**
  - API routes use Next.js Edge Runtime for low-latency LLM streaming.

## Integration Points
- **External Services:**
  - Azure OpenAI, DeepSeek, Gemini (see `lib/llmService.ts` and `app/api/co-writer/chat/route.ts`).
- **Frontend/Backend Communication:**
  - Uses fetch/XHR to communicate with API routes, expects streaming responses for chat.

## Examples
- To add a new chat model:
  1. Implement a new service in `lib/` (e.g., `myLLMService.ts`).
  2. Update `getLLMService` in `lib/llmService.ts`.
  3. Update model selection logic in API route if needed.

---

For questions or unclear patterns, review `lib/llmService.ts`, `app/api/co-writer/chat/route.ts`, and `components/` for examples.
