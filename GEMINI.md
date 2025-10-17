# Project Overview

This is a Next.js application that provides a chat-based notebook interface. It allows users to interact with an AI assistant (CoWriter) to collaboratively edit and manage Markdown-based notebooks. The application uses a custom hook (`useCoWriter`) to manage the state of the notebooks and chat messages, and it communicates with a backend API to stream responses from an AI model. The application supports multiple AI models, including those from Azure AI. It also includes text-to-speech functionality.

## Key Technologies

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes
*   **AI:** Google Gemini, Azure AI
*   **Testing:** Vitest, React Testing Library

# Building and Running

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    AZURE_ENDPOINT=YOUR_AZURE_ENDPOINT
    AZURE_MODEL_NAME=YOUR_AZURE_MODEL_NAME
    AZURE_API_KEY=YOUR_AZURE_API_KEY
    AZURE_OPENAI_API_KEY=YOUR_AZURE_OPENAI_API_KEY
    AZURE_OPENAI_ENDPOINT=YOUR_AZURE_OPENAI_ENDPOINT
    AZURE_TTS_API_KEY=YOUR_AZURE_TTS_API_KEY
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

5.  **Run in production:**
    ```bash
    npm run start
    ```

# Development Conventions

*   **State Management:** The application uses a custom hook (`useCoWriter`) and a singleton class (`CoWriter`) to manage the application's state. The state is persisted to local storage.
*   **API Communication:** The frontend communicates with the backend via a Next.js API route (`/api/co-writer/chat`). The backend then forwards the request to the appropriate AI model.
*   **Prompt Engineering:** The `lib/promptBuilder.ts` file contains the logic for constructing the prompt that is sent to the AI model. The system instruction in this file is critical for ensuring that the AI model responds in the correct format.
*   **Testing:** The project uses Vitest and React Testing Library for testing. Test files are located alongside the files they are testing (e.g., `app/page.test.tsx`).
