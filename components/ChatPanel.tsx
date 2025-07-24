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
  modelName: string;
  isTtsSpeaking: boolean; // NEW: Added prop for TTS state
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onApplyChanges,
  onRejectChanges,
  onHighlightCell,
  modelName,
  isTtsSpeaking, // NEW: Added prop for TTS state
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingMode, setRecordingMode] = useState<'auto-stop' | 'continuous'>('auto-stop');
  const [speechLang, setSpeechLang] = useState<'en-US' | 'de-DE'>('en-US');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingModeRef = useRef(recordingMode);
  const isListeningRef = useRef(isListening);
  const speechBufferRef = useRef(''); // NEW: Buffer for speech during loading
  
  // keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  // Sync recording mode with state
  useEffect(() => {
    recordingModeRef.current = recordingMode;
  }, [recordingMode]);

  // NEW: Effect to handle speech buffer when loading completes
  useEffect(() => {
    if (!isLoading && speechBufferRef.current) {
      onSendMessage(speechBufferRef.current.trim());
      speechBufferRef.current = '';
    }
  }, [isLoading, onSendMessage]);

  // NEW: Effect to pause recognition during TTS and model responses
  useEffect(() => {
    if ((isLoading || isTtsSpeaking) && isListening) {
      recognitionRef.current.stop();
    }
  }, [isLoading, isTtsSpeaking, isListening]);

  // Speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const finalText = event.results[i][0].transcript;
          finalTranscriptRef.current += finalText;
          
          // NEW: Handle continuous mode with loading state
          if (recordingModeRef.current === 'continuous') {
            if (!isLoading && !isTtsSpeaking) {
              onSendMessage(finalText.trim());
            } else {
              // Buffer speech during loading/TTS
              speechBufferRef.current += finalText + ' ';
            }
            finalTranscriptRef.current = '';
          }
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInterimSpeech(interimTranscript);
      setInput(finalTranscriptRef.current + interimTranscript);
      if (recordingModeRef.current === 'auto-stop') {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setCountdown(5);
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 5000);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      if (recordingModeRef.current === 'auto-stop') {
        setCountdown(5);
      }
    };

    recognition.onend = () => {
      if (recordingModeRef.current === 'auto-stop') {
        setIsListening(false);
        if (finalTranscriptRef.current.trim() !== '') {
          onSendMessage(finalTranscriptRef.current.trim());
        }
        setInput('');
        finalTranscriptRef.current = '';
        setInterimSpeech('');
        setCountdown(null);
      } else {
        // In continuous mode: restart recognition with proper cleanup
        if (isListeningRef.current && !isLoading && !isTtsSpeaking) {
          setInterimSpeech('');
          finalTranscriptRef.current = '';
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Recognition restart error:', error);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimSpeech('');
      setCountdown(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [onSendMessage, speechLang, isTtsSpeaking]); // NEW: Added isTtsSpeaking dependency

  // Countdown effect - only for auto-stop mode
  useEffect(() => {
    if (recordingModeRef.current === 'auto-stop' && countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev! - 0.1;
          return newValue > 0 ? Number(newValue.toFixed(1)) : 0;
        });
      }, 100);
    } else if (countdown === 0) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setCountdown(null);
    } else {
      finalTranscriptRef.current = '';
      setInput('');
      setInterimSpeech('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleRecordingMode = () => {
    // NEW: Immediately disable continuous mode
    if (isListening && recordingMode === 'continuous') {
      recognitionRef.current.stop();
    }
    setRecordingMode(prev => prev === 'auto-stop' ? 'continuous' : 'auto-stop');
  };

  const toggleSpeechLang = () => {
    setSpeechLang(prev => prev === 'en-US' ? 'de-DE' : 'en-US');
  };

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

  // NEW: Restart speech recognition in continuous mode after response & TTS are both finished
  useEffect(() => {
    if (
      recordingMode === 'continuous' &&
      isListening &&
      !isLoading &&
      !isTtsSpeaking
    ) {
      // browser's recognition might already be running - first try to stop if needed
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      // restart after short delay to prevent race with onend handler
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          // Recognition might already be started; ignore
        }
      }, 100);
    }
    // eslint-disable-next-line
  }, [isLoading, isTtsSpeaking]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-l border-gray-700/50 w-full flex flex-col h-full max-h-full">
      {/* Show selected model and language in chat panel header */}
      <div className="px-6 pt-4 pb-2 text-gray-300 text-sm font-semibold flex items-center justify-between">
        <span>Model: {modelName}</span>
        <button
          type="button"
          onClick={toggleSpeechLang}
          disabled={isListening}
          className={`ml-4 px-2 py-1 rounded text-xs font-medium border ${!isListening ? 'text-gray-400 border-gray-500 hover:text-white hover:border-white' : 'text-gray-500 border-gray-700 cursor-not-allowed'}`}
          title={`Switch to ${speechLang === 'en-US' ? 'German' : 'English'} (Speech)`}
        >
          {speechLang === 'en-US' ? 'EN' : 'DE'}
        </button>
      </div>
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
                className={`max-w-md rounded-xl px-4 py-2 text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}
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
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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
              className={`p-1 rounded-full ${!isListening ? 'text-gray-400 hover:text-white' : 'text-gray-500'}`} // REMOVED: disabled state
              title={`Switch to ${recordingMode === 'auto-stop' ? 'continuous' : 'auto-stop'} mode`}
            >
              {recordingMode === 'auto-stop' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-2 rounded-full relative ${isListening
                ? 'text-red-500 bg-red-900/50 animate-pulse'
                : 'text-gray-400 bg-gray-600/50 hover:bg-gray-500'
                } transition-colors`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              {recordingMode === 'auto-stop' && countdown !== null && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {Math.ceil(countdown)}
                </div>
              )}
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-full text-white bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;