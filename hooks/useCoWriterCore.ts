// hooks/useCoWriterCore.ts
import { useState, useEffect } from 'react';
import { CoWriter, CoWriterState } from '../lib/coWriter';
import { streamChatResponse } from '../lib/backendService'; // Updated import
import { models } from '@/lib/azureService';

// A single, shared instance of the CoWriter class
let coWriterInstance: CoWriter | null = null;

export const useCoWriterCore = (modelName: keyof typeof models, selectedNotebook: number) => {
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
    coWriterInstance!.setSelectedNotebook(selectedNotebook);
  }, [selectedNotebook]);

  return {
    notebooks: state.notebooks,
    selectedNotebook: state.selectedNotebook,
    cells: state.notebooks[state.selectedNotebook] || [],
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addNotebook: coWriterInstance!.addNotebook,
    removeNotebook: coWriterInstance!.removeNotebook,
    setSelectedNotebook: coWriterInstance!.setSelectedNotebook.bind(coWriterInstance),
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