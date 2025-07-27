"use client";
import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../types";
import "./ChatPanel.css";
import ChatPanelHeader from "./ChatPanelHeader";
import ChatMessagesList from "./ChatMessagesList";
import ChatInput from "./ChatInput";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onApplyChanges: (messageId: string) => void;
  onRejectChanges: (messageId: string) => void;
  onHighlightCell: (cellId: string | null) => void;
  modelName: string;
  isTtsSpeaking: boolean; // NEW: Added prop for TTS state
  ttsEnabled: boolean; // NEW: TTS toggle state
  onToggleTts: (enabled: boolean) => void; // NEW: TTS toggle handler
  onClearMessages: () => void; // NEW: Clear chat handler
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
  ttsEnabled,
  onToggleTts,
  onClearMessages,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingMode, setRecordingMode] = useState<
    "auto-stop" | "continuous"
  >("auto-stop");
  const [speechLang, setSpeechLang] = useState<"en-US" | "de-DE">("en-US");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingModeRef = useRef(recordingMode);
  const isListeningRef = useRef(isListening);
  const speechBufferRef = useRef(""); // NEW: Buffer for speech during loading

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
      speechBufferRef.current = "";
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
    if (!("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const finalText = event.results[i][0].transcript;
          finalTranscriptRef.current += finalText;

          // NEW: Handle continuous mode with loading state
          if (recordingModeRef.current === "continuous") {
            if (!isLoading && !isTtsSpeaking) {
              onSendMessage(finalText.trim());
            } else {
              // Buffer speech during loading/TTS
              speechBufferRef.current += finalText + " ";
            }
            finalTranscriptRef.current = "";
          }
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInterimSpeech(interimTranscript);
      setInput(finalTranscriptRef.current + interimTranscript);
      if (recordingModeRef.current === "auto-stop") {
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
      if (recordingModeRef.current === "auto-stop") {
        setCountdown(5);
      }
    };

    recognition.onend = () => {
      if (recordingModeRef.current === "auto-stop") {
        setIsListening(false);
        if (finalTranscriptRef.current.trim() !== "") {
          onSendMessage(finalTranscriptRef.current.trim());
        }
        setInput("");
        finalTranscriptRef.current = "";
        setInterimSpeech("");
        setCountdown(null);
      } else {
        // In continuous mode: restart recognition with proper cleanup
        if (isListeningRef.current && !isLoading && !isTtsSpeaking) {
          setInterimSpeech("");
          finalTranscriptRef.current = "";
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Recognition restart error:", error);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimSpeech("");
      setCountdown(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [onSendMessage, speechLang, isTtsSpeaking]); // NEW: Added isTtsSpeaking dependency

  // Countdown effect - only for auto-stop mode
  useEffect(() => {
    if (
      recordingModeRef.current === "auto-stop" &&
      countdown !== null &&
      countdown > 0
    ) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          const newValue = prev! - 0.1;
          return newValue > 0 ? Number(newValue.toFixed(1)) : 0;
        });
      }, 100);
    } else if (countdown === 0) {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
    }
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setCountdown(null);
    } else {
      finalTranscriptRef.current = "";
      setInput("");
      setInterimSpeech("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleRecordingMode = () => {
    // NEW: Immediately disable continuous mode
    if (isListening && recordingMode === "continuous") {
      recognitionRef.current.stop();
    }
    setRecordingMode((prev) =>
      prev === "auto-stop" ? "continuous" : "auto-stop"
    );
  };

  const toggleSpeechLang = () => {
    setSpeechLang((prev) => (prev === "en-US" ? "de-DE" : "en-US"));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  // NEW: Restart speech recognition in continuous mode after response & TTS are both finished
  useEffect(() => {
    if (
      recordingMode === "continuous" &&
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
    <div
      data-testid="chat-panel"
      className="bg-gray-800/50 backdrop-blur-sm border-l border-gray-700/50 w-full flex flex-col h-full max-h-full"
    >
      <ChatPanelHeader
        modelName={modelName}
        ttsEnabled={ttsEnabled}
        onToggleTts={onToggleTts}
        speechLang={speechLang}
        toggleSpeechLang={toggleSpeechLang}
        isListening={isListening}
        onClearMessages={onClearMessages}
        messagesLength={messages.length}
      />
      <ChatMessagesList
        messages={messages}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={isLoading}
      />
      <div ref={messagesEndRef} />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        interimSpeech={interimSpeech}
        toggleRecordingMode={toggleRecordingMode}
        recordingMode={recordingMode}
        isListening={isListening}
        toggleListening={toggleListening}
        isLoading={isLoading}
        countdown={countdown}
      />
    </div>
  );
};

export default ChatPanel;
