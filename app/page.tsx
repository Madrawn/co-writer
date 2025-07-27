"use client";
import React, { ReactElement } from "react";
import MarkdownCell from "../components/MarkdownCell";
import ChatPanel from "../components/ChatPanel";
import { PlusIcon, ChevronDownIcon } from "../components/icons"; // Add ChevronDownIcon
import { useCoWriter } from "../hooks/useCoWriter";
import { models } from "../lib/azureService";
import { SettingsHeader } from "../components/SettingsHeader";
import { retrieveFiles } from "./retrieveFiles";

export default function HomePage(): ReactElement {
  // Import models from azureService
  // @ts-ignore
  // eslint-disable-next-line
  const [selectedModel, setSelectedModel] = React.useState(
    Object.keys(models)[0] as keyof typeof models
  );
  const [ttsEnabled, setTtsEnabled] = React.useState(true);
  const {
    notebooks,
    cells,
    editingCellId,
    chatMessages,
    isLoading,
    highlightedCellId,
    addNotebook,
    removeNotebook,
    setSelectedNotebook: setNotebookIndex,
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleInsertFiles = async (isFolder = false) => {
    try {
      let files = await retrieveFiles(isFolder);

      for (const { file, path } of files) {
        const content = await file.text();
        const extension = file.name.split(".").pop()?.toLowerCase();
        addCell(`\`\`\`${extension}\n${content}\n\`\`\``, path); // Assumes addCell now accepts content and id
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  };

  return (
    <>
      <div className="flex h-screen w-screen bg-gray-900 font-sans">
        {/* Main Content: Markdown Notebook */}
        <main className="flex-1 h-full overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold text-gray-200 mb-6">
              Co-Writer Notebook
            </h1>
            {/* Model selection dropdown */}
            <SettingsHeader
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              notebooks={notebooks}
              addNotebook={addNotebook}
              removeNotebook={removeNotebook}
              setNotebookIndex={setNotebookIndex}
              selectedNotebook={selectedNotebook}
            ></SettingsHeader>
            {cells.map((cell) => {
              // Find the first message with a proposed change for this cell and no reviewDecision
              const msgWithChange = chatMessages.find(
                (msg) =>
                  !msg.reviewDecision &&
                  msg.proposedChanges?.some((change) => change.targetCellId === cell.id)
              );
              const proposedChange = msgWithChange?.proposedChanges?.find(
                (change) => change.targetCellId === cell.id
              )?.newContent;
              return (
                <MarkdownCell
                  key={cell.id}
                  cell={cell}
                  isEditing={editingCellId === cell.id}
                  isHighlighted={highlightedCellId === cell.id}
                  onStartEditing={startEditingCell}
                  onStopEditing={stopEditingCell}
                  onDelete={deleteCell}
                  onUpdateCellId={handleUpdateCellId}
                  proposedChange={proposedChange}
                />
              );
            })}
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => addCell()}
                  className="flex-1 flex items-center justify-center p-3 border-2 border-dashed border-gray-600 rounded-l-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Cell
                </button>
                <button
                  title="Add cell Menu"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-3 border-t-2 border-b-2 border-r-2 border-dashed border-gray-600 rounded-r-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
                >
                  <ChevronDownIcon className="w-5 h-5" />
                </button>
              </div>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      handleInsertFiles(false);
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700"
                  >
                    Insert file(s)
                  </button>
                  <button
                    onClick={() => {
                      handleInsertFiles(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700"
                  >
                    Insert folder
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        {/* Side Panel: Chat */}
        <aside className="w-[450px] flex-shrink-0 h-full">
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
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
