import { useState, useEffect, useCallback, useRef } from 'react';
import { speakTextWithAzureTTS, playAudioBlob } from '../lib/azureTTSService';
import { useCoWriterCore } from './useCoWriterCore';

export const useCoWriter = () => {
  const {
    cells,
    chatMessages,
    isLoading,
    addCell: coreAddCell,
    deleteCell,
    updateCell,
    updateCellId,
    handleSendMessage,
    handleApplyChanges,
    handleRejectChanges,
  } = useCoWriterCore();
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
    if (prevIsLoadingRef.current && !isLoading) {
      if (!chatMessages || chatMessages.length === 0) return;
      // Find the last model message with content
      const lastModelMsg = [...chatMessages].reverse().find(m => m.role === 'model' && m.content);
      if (lastModelMsg && lastSpokenIdRef.current !== lastModelMsg.id) {
        lastSpokenIdRef.current = lastModelMsg.id;
        const textToSpeak = lastModelMsg.cleanContent || lastModelMsg.content;
        speakTextWithAzureTTS(textToSpeak)
          .then(playAudioBlob)
          .catch((err) => {
            console.error('Azure TTS error:', err);
          });
      }
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, chatMessages]);

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
    cells,
    editingCellId,
    chatMessages,
    isLoading,
    highlightedCellId,
    addCell,
    deleteCell,
    startEditingCell,
    stopEditingCell,
    handleSendMessage,
    handleApplyChanges,
    handleRejectChanges,
    setHighlightedCellId,
    handleUpdateCellId,
  };
};
