"use client";
import React, { ReactElement, useCallback } from "react";
import ChatPanel from "../components/ChatPanel";

import { useCoWriter } from "../hooks/useCoWriter";
import { models } from "../types";
import { retrieveFiles } from "./retrieveFiles";
import MainPanel from "@/components/MainPanel";

export default function HomePage(): ReactElement {
  // Import models from azureService
  const [selectedModel, setSelectedModel] = React.useState<keyof typeof models>(
    Object.keys(models)[0] as keyof typeof models
  );
  const [ttsEnabled, setTtsEnabled] = React.useState<boolean>(true);
  const {
    notebooks,
    cells,
    editingCellId,
    chatMessages,
    isLoading,
    highlightedCellId,
    addNotebook,
    removeNotebook,
    selectNotebookByIndex,
    selectedNotebook,
    addCell,
    deleteCell,
    startEditingCell,
    stopEditingCell,
    handleSendMessage,
    handleApplyChanges,
    handleRejectChanges,
    setHighlightedCellId,
    handleUpdateCellId,
    isTtsSpeaking,
    clearChatMessages,
  } = useCoWriter(selectedModel, 0, ttsEnabled);
  const handleSendMessageCB = useCallback(
    (message: string) => handleSendMessage(message),
    [selectedModel] // No dependencies needed
  );
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const handleInsertFiles = useCallback(
    async (isFolder: boolean = false): Promise<void> => {
      try {
        const files = await retrieveFiles(isFolder);

        for (const { file, path } of files) {
          const content = await file.text();
          const extension = file.name.split(".").pop()?.toLowerCase();
          addCell(`\`\`\`${extension}\n${content}\n\`\`\``, path); // Assumes addCell now accepts content and id
        }
      } catch (error) {
        console.error("Error selecting files:", error);
      }
    },
    [addCell]
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen w-screen bg-gray-900 font-sans">
        {/* Main Content: Markdown Notebook */}
        <main className="flex-1 h-full overflow-y-auto p-2 lg:p-8">
          <MainPanel
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            notebooks={notebooks}
            cells={cells}
            editingCellId={editingCellId}
            chatMessages={chatMessages}
            highlightedCellId={highlightedCellId}
            addNotebook={addNotebook}
            removeNotebook={removeNotebook}
            setNotebookIndex={selectNotebookByIndex}
            selectedNotebook={selectedNotebook}
            addCell={addCell}
            deleteCell={deleteCell}
            startEditingCell={startEditingCell}
            stopEditingCell={stopEditingCell}
            handleUpdateCellId={handleUpdateCellId}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            handleInsertFiles={handleInsertFiles}
          ></MainPanel>
        </main>

        {/* Side Panel: Chat */}
        <aside className="shrink-1 overflow-y-auto">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessageCB}
            isLoading={isLoading}
            onApplyChanges={handleApplyChanges}
            onRejectChanges={handleRejectChanges}
            onHighlightCell={setHighlightedCellId}
            modelName={selectedModel}
            isTtsSpeaking={isTtsSpeaking}
            ttsEnabled={ttsEnabled}
            onToggleTts={setTtsEnabled}
            onClearMessages={clearChatMessages}
          />
        </aside>
      </div>
    </>
  );
}
