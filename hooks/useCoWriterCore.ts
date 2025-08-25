import { useState, useEffect } from "react";
import { CoWriter } from "../lib/coWriter";
import { CoWriterState, models } from "@/types";
import { streamChatResponse } from "../lib/backendService"; // Updated import

// A single, shared instance of the CoWriter class
const coWriterInstance = new CoWriter(streamChatResponse, "DeepSeek-R1-0528");

export const useCoWriterCore = (
  modelName: keyof typeof models,
  selectedNotebook: number
) => {

  const [state, setState] = useState<CoWriterState>(() =>
    coWriterInstance.getState()
  );

  useEffect(() => {
    const unsubscribe = coWriterInstance.subscribe(setState);
    return unsubscribe;
  }, [coWriterInstance]);

  useEffect(() => {
    coWriterInstance.setModelName(modelName);
  }, [modelName, coWriterInstance]);

  useEffect(() => {
    coWriterInstance.selectNotebookByIndex(selectedNotebook);
  }, [selectedNotebook, coWriterInstance]);

  return {
    notebooks: state.notebooks,
    selectedNotebook: state.selectedNotebook,
    cells: state.notebooks[state.selectedNotebook] || [],
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addNotebook: coWriterInstance.addNotebook,
    removeNotebook: coWriterInstance.removeNotebook,
    selectNotebookByIndex: coWriterInstance.selectNotebookByIndex,
    addCell: coWriterInstance.addCell,
    deleteCell: coWriterInstance.deleteCell,
    updateCell: coWriterInstance.updateCell,
    updateCellId: coWriterInstance.updateCellId,
    handleSendMessage: (message: string) =>
      coWriterInstance.handleSendMessage(message, modelName),
    handleApplyChanges: coWriterInstance.handleApplyChanges,
    handleRejectChanges: coWriterInstance.handleRejectChanges,
    clearChatMessages: () => coWriterInstance.clearChatMessages(),
  };
};
