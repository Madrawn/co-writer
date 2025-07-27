import React from "react";
import ChangePreview from "./ChangePreview";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../types";

interface ChatMessagesListProps {
  messages: ChatMessage[];
  onApplyChanges: (messageId: string) => void;
  onRejectChanges: (messageId: string) => void;
  onHighlightCell: (cellId: string | null) => void;
  isLoading: boolean;
}

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
  messages,
  onApplyChanges,
  onRejectChanges,
  onHighlightCell,
  isLoading,
}) => (
  <div className="flex-1 p-6 overflow-y-auto space-y-4">
    {messages.map((msg) => {
      const showChangeCard =
        msg.role === "model" &&
        msg.proposedChanges &&
        msg.proposedChanges.length > 0;
      if (showChangeCard) {
        return (
          <div key={msg.id} className="flex justify-start">
            <div className="max-w-md w-full">
              <ChangePreview
                messageId={msg.id}
                changes={msg.proposedChanges!}
                reviewDecision={msg.reviewDecision}
                onApply={onApplyChanges}
                onReject={onRejectChanges}
                cleanContent={msg.cleanContent || ""}
                onHighlightCell={onHighlightCell}
              />
            </div>
          </div>
        );
      }
      return (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-md rounded-xl px-4 py-2 text-white ${
              msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-white prose-code:text-pink-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.cleanContent || msg.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      );
    })}
    {isLoading && messages[messages.length - 1]?.role === "user" && (
      <div className="flex justify-start">
        <div className="max-w-md rounded-xl px-4 py-3 bg-gray-700">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse pulse-delay-200"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse pulse-delay-400"></div>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ChatMessagesList;
