// hooks/useCoWriterCore.ts
import { useState, useEffect } from 'react';
import { CoWriter, CoWriterState } from '../lib/coWriter';
import { streamChatResponse } from '../lib/backendService'; // Updated import

// A single, shared instance of the CoWriter class
let coWriterInstance: CoWriter | null = null;

export const useCoWriterCore = (modelName: string, selectedSlot: number) => {
  const [state, setState] = useState<CoWriterState>(() => {
    if (!coWriterInstance) {
      coWriterInstance = new CoWriter(streamChatResponse, modelName);
      return coWriterInstance.getState();
    }
    return coWriterInstance.getState();
  });

  useEffect(() => {
    const unsubscribe = coWriterInstance!.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    coWriterInstance!.setModelName(modelName);
  }, [modelName]);

  useEffect(() => {
    coWriterInstance!.setSlot(selectedSlot);
  }, [selectedSlot]);

  return {
    cells: state.cells[selectedSlot] || [],
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addCell: coWriterInstance!.addCell,
    deleteCell: coWriterInstance!.deleteCell,
    updateCell: coWriterInstance!.updateCell,
    updateCellId: coWriterInstance!.updateCellId,
    handleSendMessage: (message: string) => 
      coWriterInstance!.handleSendMessage(message, modelName),
    handleApplyChanges: coWriterInstance!.handleApplyChanges,
    handleRejectChanges: coWriterInstance!.handleRejectChanges,
  };
};