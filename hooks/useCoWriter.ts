"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { speakTextInChunks } from '../lib/azureTTSService'; // Updated import
import { useCoWriterCore } from './useCoWriterCore';
import { models } from '@/lib/azureService';

export const useCoWriter = (
  modelName: keyof typeof models,
  selectedNotebook: number,
  ttsEnabled: boolean = true
) => {
  const {
    notebooks,
    selectedNotebook: currentNotebook,
    cells,
    chatMessages,
    isLoading,
    addNotebook,
    removeNotebook,
    setSelectedNotebook,
    addCell: coreAddCell,
    deleteCell,
    updateCell,
    updateCellId,
    handleSendMessage,
    handleApplyChanges,
    handleRejectChanges,
  } = useCoWriterCore(modelName, selectedNotebook);
  const handleUpdateCellId = useCallback((oldId: string, newId: string) => {
    updateCellId(oldId, newId);
  }, [updateCellId]);

  // Track last spoken message to avoid repeats
  const lastSpokenIdRef = useRef<string | null>(null);

  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [highlightedCellId, setHighlightedCellId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedCellId) {
      const element = document.querySelector(`[data-cell-id="${highlightedCellId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedCellId]);

  // TTS effect: speak new model message only when isLoading switches to false
  const prevIsLoadingRef = useRef<boolean>(isLoading);
  useEffect(() => {
    // Only run when isLoading transitions from true to false
    if (prevIsLoadingRef.current && !isLoading && ttsEnabled) {
      if (!chatMessages || chatMessages.length === 0) return;
      // Find the last model message with content
      const lastModelMsg = [...chatMessages].reverse().find(m => m.role === 'model' && m.content);
      if (lastModelMsg && lastSpokenIdRef.current !== lastModelMsg.id) {
        lastSpokenIdRef.current = lastModelMsg.id;
        const textToSpeak = lastModelMsg.cleanContent || lastModelMsg.content;
        // Use chunked TTS instead of single request
        speakTextInChunks(textToSpeak).catch((err) => {
          console.error('Azure TTS error:', err);
        });
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, chatMessages, ttsEnabled]);

  const addCell = useCallback(() => {
    const newCellId = coreAddCell();
    setEditingCellId(newCellId);
  }, [coreAddCell]);

  const startEditingCell = useCallback((id: string) => {
      setEditingCellId(id);
  }, []);

  const stopEditingCell = useCallback((id: string, content: string) => {
    updateCell(id, content);
    setEditingCellId(null);
  }, [updateCell]);

  return {
    notebooks,
    selectedNotebook: currentNotebook,
    cells,
    editingCellId,
    chatMessages,
    isLoading,
    highlightedCellId,
    addNotebook,
    removeNotebook,
    setSelectedNotebook,
    addCell,
    deleteCell,
    startEditingCell,
    stopEditingCell,
    handleSendMessage,
    handleApplyChanges,
    handleRejectChanges,
    setHighlightedCellId,
    handleUpdateCellId,
    isTtsSpeaking: false, // Placeholder for TTS speaking state
  };
};