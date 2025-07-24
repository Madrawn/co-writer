
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChangePreview from './ChangePreview';


interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onApplyChanges: (messageId: string) => void;
  onRejectChanges: (messageId: string) => void;
  onHighlightCell: (cellId: string | null) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onApplyChanges,
  onRejectChanges,
  onHighlightCell,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-l border-gray-700/50 w-full flex flex-col h-full max-h-full">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const showChangeCard = msg.role === 'model' && msg.proposedChanges && msg.proposedChanges.length > 0;

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
                          cleanContent={msg.cleanContent || ''}
                          onHighlightCell={onHighlightCell}
                      />
                  </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md rounded-xl px-4 py-2 text-white ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-white prose-code:text-pink-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.cleanContent || msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )
        })}
         {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="max-w-md rounded-xl px-4 py-3 bg-gray-700">
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Ask Gemini anything..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-gray-700 rounded-full py-3 pl-4 pr-12 text-gray-200 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;