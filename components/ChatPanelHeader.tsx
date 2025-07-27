import React from "react";

interface ChatPanelHeaderProps {
  modelName: string;
  ttsEnabled: boolean;
  onToggleTts: (enabled: boolean) => void;
  speechLang: "en-US" | "de-DE";
  toggleSpeechLang: () => void;
  isListening: boolean;
  onClearMessages: () => void;
  messagesLength: number;
}

const ChatPanelHeader: React.FC<ChatPanelHeaderProps> = ({
  modelName,
  ttsEnabled,
  onToggleTts,
  speechLang,
  toggleSpeechLang,
  isListening,
  onClearMessages,
  messagesLength,
}) => (
  <div className="px-6 pt-4 pb-2 text-gray-300 text-sm font-semibold flex items-center justify-between">
    <span>Model: {modelName}</span>
    <div className="flex items-center space-x-2">
      {/* TTS Toggle Button */}
      <button
        type="button"
        onClick={() => onToggleTts(!ttsEnabled)}
        className={`px-2 py-1 rounded text-xs font-medium border ${
          ttsEnabled
            ? "text-green-400 border-green-500 bg-green-900/30"
            : "text-gray-400 border-gray-500 hover:text-white hover:border-white"
        }`}
        title={ttsEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
      >
        {ttsEnabled ? "TTS On" : "TTS Off"}
      </button>
      {/* Language Selector */}
      <button
        type="button"
        onClick={toggleSpeechLang}
        disabled={isListening}
        className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${
          !isListening
            ? "text-gray-400 border-gray-500 hover:text-white hover:border-white"
            : "text-gray-500 border-gray-700 cursor-not-allowed"
        }`}
        title={`Switch to ${speechLang === "en-US" ? "German" : "English"} (Speech)`}
      >
        {speechLang === "en-US" ? "EN" : "DE"}
      </button>
      {/* Clear Chat Button */}
      <button
        type="button"
        onClick={onClearMessages}
        className="ml-2 px-2 py-1 rounded text-xs font-medium border text-red-400 border-red-500 hover:bg-red-900/30"
        title="Clear chat messages"
        disabled={messagesLength === 0}
      >
        Clear
      </button>
    </div>
  </div>
);

export default ChatPanelHeader;
