// hooks/useCoWriterCore.ts
// This hook provides the core functionality of the CoWriter application,
// allowing components to interact with the CoWriter instance and its state.
import { useState, useEffect } from 'react';
import { CoWriter, CoWriterState } from '../lib/coWriter';
// import { streamChatResponse } from '../lib/geminiService';
import { streamChatResponse, models } from '../lib/azureService';

// A single, shared instance of the CoWriter class for the application's lifetime.
const coWriterInstance = new CoWriter(
  streamChatResponse,
  Object.keys(models)[0] as keyof typeof models
);

export const useCoWriterCore = (modelName: string, selectedSlot: number) => {
  // Initialize state lazily from the instance to prevent UI flicker on load.
  const [state, setState] = useState<CoWriterState>(() => coWriterInstance.getState());

  useEffect(() => {
    // The subscribe method provides the current state to the listener immediately
    // and returns an unsubscribe function for cleanup, which useEffect will call.
    const unsubscribe = coWriterInstance.subscribe(setState);
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only on mount and unmount.

  // Update model name on change
  useEffect(() => {
    coWriterInstance.setModelName(modelName);
  }, [modelName]);
  // Update slot on change
  useEffect(() => {
    coWriterInstance.setSlot(selectedSlot);
  }, [selectedSlot]);

  return {
    cells: state.cells[selectedSlot] || [],
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addCell: coWriterInstance.addCell,
    deleteCell: coWriterInstance.deleteCell,
    updateCell: coWriterInstance.updateCell,
    updateCellId: coWriterInstance.updateCellId,
    handleSendMessage: (message: string) => coWriterInstance.handleSendMessage(message, modelName),
    handleApplyChanges: coWriterInstance.handleApplyChanges,
    handleRejectChanges: coWriterInstance.handleRejectChanges,
  };
};
