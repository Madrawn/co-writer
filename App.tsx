import React from 'react';
import MarkdownCell from './components/MarkdownCell';
import ChatPanel from './components/ChatPanel';
import { PlusIcon } from './components/icons';
import { useCoWriter } from './hooks/useCoWriter';

const App: React.FC = () => {
  const {
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
  } = useCoWriter();

  return (
    <div className="flex h-screen w-screen bg-gray-900 font-sans">
      {/* Main Content: Markdown Notebook */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold text-gray-200 mb-6">Co-Writer Notebook</h1>
          {cells.map(cell => (
            <MarkdownCell
              key={cell.id}
              cell={cell}
              isEditing={editingCellId === cell.id}
              isHighlighted={highlightedCellId === cell.id}
              onStartEditing={startEditingCell}
              onStopEditing={stopEditingCell}
              onDelete={deleteCell}
            />
          ))}
          <button
            onClick={addCell}
            className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Cell
          </button>
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
        />
      </aside>
    </div>
  );
};

export default App;
