import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageBase } from "@/types";

type ChatMessageWithThinking = ChatMessageBase & {
  thinking?: string;
};

const MessageBubble = (props: { msg: ChatMessageWithThinking }) => {
  const plugins = useMemo(() => [remarkGfm], []);
  const [showThinking, setShowThinking] = useState<boolean>(false);

  const isThinkingVisible = showThinking ? "true" : "false";
  return (
    <div
      className={`flex ${
        props.msg.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-md rounded-xl px-4 py-2 text-white ${
          props.msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        {/* Foldable thinking section */}
        {props.msg.thinking && (
          <div className="mb-2">
            <button
              className="text-xs text-gray-300 bg-gray-800 border border-gray-600 rounded px-2 py-1 mb-1 hover:bg-gray-700 focus:outline-none"
              onClick={() => setShowThinking((v) => !v)}
              aria-expanded={isThinkingVisible}
              aria-controls={`thinking-${props.msg.id}`}
              type="button"
            >
              {showThinking ? "Hide" : "Show"} Model Thinking
            </button>
            {showThinking && (
              <div
                id={`thinking-${props.msg.id}`}
                className="prose prose-invert prose-xs bg-gray-900/80 rounded p-2 border border-gray-700 text-gray-200 mb-2 whitespace-pre-wrap"
              >
                <ReactMarkdown remarkPlugins={plugins}>
                  {props.msg.thinking}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-white prose-code:text-pink-300">
          <ReactMarkdown remarkPlugins={plugins}>
            {props.msg.cleanContent || props.msg.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
