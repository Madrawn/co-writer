import { useState, useEffect } from 'react';
import { CoWriter, CoWriterState } from '../lib/coWriter';
// import { streamChatResponse } from '../lib/geminiService';
import { streamChatResponse } from '../lib/azureService'; // New import


// A single, shared instance of the CoWriter class for the application's lifetime.
const coWriterInstance = new CoWriter(streamChatResponse);

export const useCoWriterCore = () => {
  // Initialize state lazily from the instance to prevent UI flicker on load.
  const [state, setState] = useState<CoWriterState>(() => coWriterInstance.getState());

  useEffect(() => {
    // The subscribe method provides the current state to the listener immediately
    // and returns an unsubscribe function for cleanup, which useEffect will call.
    const unsubscribe = coWriterInstance.subscribe(setState);
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only on mount and unmount.

  // The returned methods are bound to the singleton instance, so they are stable
  // and don't need to be wrapped in useCallback by consuming hooks.
  return {
    cells: state.cells,
    chatMessages: state.chatMessages,
    isLoading: state.isLoading,
    addCell: coWriterInstance.addCell,
    deleteCell: coWriterInstance.deleteCell,
    updateCell: coWriterInstance.updateCell,
    handleSendMessage: coWriterInstance.handleSendMessage,
    handleApplyChanges: coWriterInstance.handleApplyChanges,
    handleRejectChanges: coWriterInstance.handleRejectChanges,
  };
};
