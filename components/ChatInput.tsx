import React, { memo } from "react";
import { PaperAirplaneIcon } from "./icons";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e: React.FormEvent) => void;
  interimSpeech: string;
  toggleRecordingMode: () => void;
  recordingMode: "auto-stop" | "continuous";
  isListening: boolean;
  toggleListening: () => void;
  isLoading: boolean;
  countdown: number | null;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  interimSpeech,
  toggleRecordingMode,
  recordingMode,
  isListening,
  toggleListening,
  isLoading,
  countdown,
}) => (
  <div className="p-4 border-t border-gray-700/50">
    <form onSubmit={handleSend} className="relative">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
          }
        }}
        placeholder="Ask CoWriter anything..."
        disabled={isLoading || isListening}
        rows={1}
        className="w-full bg-gray-700 rounded-full py-3 pl-4 pr-24 text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
      />
      {interimSpeech && (
        <div className="absolute bottom-14 left-4 right-4 bg-gray-600/80 rounded-lg p-2 text-sm text-gray-300 animate-pulse">
          {interimSpeech}
        </div>
      )}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-2">
        {/* Always show mode toggle button */}
        <button
          type="button"
          onClick={toggleRecordingMode}
          className={`p-1 rounded-full ${
            !isListening ? "text-gray-400 hover:text-white" : "text-gray-500"
          }`}
          title={`Switch to ${
            recordingMode === "auto-stop" ? "continuous" : "auto-stop"
          } mode`}
        >
          {recordingMode === "auto-stop" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          className={`p-2 rounded-full relative ${
            isListening
              ? "text-red-500 bg-red-900/50 animate-pulse"
              : "text-gray-400 bg-gray-600/50 hover:bg-gray-500"
          } transition-colors`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
          {recordingMode === "auto-stop" && countdown !== null && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {Math.ceil(countdown!)}
            </div>
          )}
        </button>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-full text-white bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  </div>
);

export default memo(ChatInput);
