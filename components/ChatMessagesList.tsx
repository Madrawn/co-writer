import React, { memo } from "react";
import ChangePreview from "./ChangePreview";
import type { ChatMessage } from "../types";
import MessageBubble from "./MessageBubble";

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
  <div className="flex-1 h-full p-6 overflow-y-auto space-y-4">
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
      return <MessageBubble key={msg.id} msg={msg}></MessageBubble>;
    })}
    {isLoading && messages[messages.length - 1]?.role === "user" && (
      <div role="status" className="flex justify-start">
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

export default memo(ChatMessagesList);
