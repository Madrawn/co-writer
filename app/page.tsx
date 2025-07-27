"use client";
import React, { ReactElement } from "react";
import MarkdownCell from "../components/MarkdownCell";
import ChatPanel from "../components/ChatPanel";
import { PlusIcon, ChevronDownIcon } from "../components/icons";
import { useCoWriter } from "../hooks/useCoWriter";
import { models } from "../lib/azureService";
import { SettingsHeader } from "../components/SettingsHeader";
import { retrieveFiles } from "./retrieveFiles";
import { ChatMessage, MarkdownCellData } from "@/types";

interface MainPanelProps {
  selectedModel: keyof typeof models;
  setSelectedModel: React.Dispatch<React.SetStateAction<keyof typeof models>>;
  notebooks: MarkdownCellData[][];
  addNotebook: () => void;
  removeNotebook: (id: number) => void;
  setNotebookIndex: (idx: number) => void;
  selectedNotebook: number;
  cells: MarkdownCellData[];
  editingCellId: string | null;
  find: (predicate: (msg: ChatMessage) => boolean) => ChatMessage | undefined;
  highlightedCellId: string | null;
  addCell: (content?: string, id?: string) => void;
  deleteCell: (id: string) => void;
  startEditingCell: (id: string) => void;
  stopEditingCell: (id: string, content: string) => void;
  handleUpdateCellId: (oldId: string, newId: string) => void;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleInsertFiles: (isFolder?: boolean) => Promise<void>;
}

function MainPanel(props: MainPanelProps): ReactElement {
  return (
    <main className="flex-1 h-full overflow-y-auto p-2 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-200 mb-6">
          Co-Writer Notebook
        </h1>
        {/* Model selection dropdown */}
        <SettingsHeader
          selectedModel={props.selectedModel}
          setSelectedModel={props.setSelectedModel}
          notebooks={props.notebooks}
          addNotebook={props.addNotebook}
          removeNotebook={props.removeNotebook}
          setNotebookIndex={props.setNotebookIndex}
          selectedNotebook={props.selectedNotebook}
        ></SettingsHeader>
        {props.cells.map((cell) => {
          // Find the first message with a proposed change for this cell and no reviewDecision
          const msgWithChange = props.find(
            (msg) =>
              !msg.reviewDecision &&
              !!msg.proposedChanges?.some(
                (change) => change.targetCellId === cell.id
              )
          );
          const proposedChange = msgWithChange?.proposedChanges?.find(
            (change) => change.targetCellId === cell.id
          )?.newContent;
          return (
            <MarkdownCell
              key={cell.id}
              cell={cell}
              isEditing={props.editingCellId === cell.id}
              isHighlighted={props.highlightedCellId === cell.id}
              onStartEditing={props.startEditingCell}
              onStopEditing={props.stopEditingCell}
              onDelete={props.deleteCell}
              onUpdateCellId={props.handleUpdateCellId}
              proposedChange={proposedChange}
            />
          );
        })}
        <div className="relative">
          <div className="flex">
            <button
              onClick={() => props.addCell()}
              className="flex-1 flex items-center justify-center p-3 border-2 border-dashed border-gray-600 rounded-l-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Cell
            </button>
            <button
              title="Add cell Menu"
              onClick={() => props.setMenuOpen(!props.menuOpen)}
              className="p-3 border-t-2 border-b-2 border-r-2 border-dashed border-gray-600 rounded-r-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
            >
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </div>

          {props.menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  props.handleInsertFiles(false);
                  props.setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700"
              >
                Insert file(s)
              </button>
              <button
                onClick={() => {
                  props.handleInsertFiles(true);
                  props.setMenuOpen(false);
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
  );
}

export default function HomePage(): ReactElement {
  // Import models from azureService
  // @ts-ignore
  // eslint-disable-next-line
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
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const handleInsertFiles = async (
    isFolder: boolean = false
  ): Promise<void> => {
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
      <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-900 font-sans">
        {/* Main Content: Markdown Notebook */}
        <MainPanel
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          notebooks={notebooks}
          cells={cells}
          editingCellId={editingCellId}
          find={chatMessages.find}
          highlightedCellId={highlightedCellId}
          addNotebook={addNotebook}
          removeNotebook={removeNotebook}
          setNotebookIndex={setNotebookIndex}
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
        {/* Side Panel: Chat */}
        <aside className="flex-shrink-0 ">
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
