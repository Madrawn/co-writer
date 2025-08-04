// hooks/useCoWriterCore.ts
import { useState, useEffect } from "react";
import { CoWriter } from "../lib/coWriter";
import { CoWriterState, models } from "@/types";
import { streamChatResponse } from "../lib/backendService"; // Updated import

// A single, shared instance of the CoWriter class
let coWriterInstance: CoWriter | null = null;

export const useCoWriterCore = (
  modelName: keyof typeof models,
  selectedNotebook: number
) => {
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
    coWriterInstance!.selectNotebookByIndex(selectedNotebook);
  }, [selectedNotebook]);

  return {
    notebooks: state.notebooks,
    selectedNotebook: state.selectedNotebook,
    cells: state.notebooks[state.selectedNotebook] || [],
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addNotebook: coWriterInstance!.addNotebook,
    removeNotebook: coWriterInstance!.removeNotebook,
    selectNotebookByIndex: coWriterInstance!.selectNotebookByIndex,
    addCell: coWriterInstance!.addCell,
    deleteCell: coWriterInstance!.deleteCell,
    updateCell: coWriterInstance!.updateCell,
    updateCellId: coWriterInstance!.updateCellId,
    handleSendMessage: (message: string) =>
      coWriterInstance!.handleSendMessage(message, modelName),
    handleApplyChanges: coWriterInstance!.handleApplyChanges,
    handleRejectChanges: coWriterInstance!.handleRejectChanges,
    clearChatMessages: coWriterInstance!.clearChatMessages,
  };
};
