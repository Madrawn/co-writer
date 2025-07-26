"use client"
import React from 'react';
import MarkdownCell from '../components/MarkdownCell';
import ChatPanel from '../components/ChatPanel';
import { PlusIcon } from '../components/icons';
import { useCoWriter } from '../hooks/useCoWriter';
import { models } from '../lib/azureService';

export default function HomePage() {
    // Import models from azureService
    // @ts-ignore
    // eslint-disable-next-line
    const [selectedModel, setSelectedModel] = React.useState(Object.keys(models)[0] as keyof typeof models);
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
    } = useCoWriter(selectedModel, 0, ttsEnabled);


    return (
        <>
            <div className="flex h-screen w-screen bg-gray-900 font-sans">
                {/* Main Content: Markdown Notebook */}
                <main className="flex-1 h-full overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h1 className="text-3xl font-bold text-gray-200 mb-6">Co-Writer Notebook</h1>
                        {/* Model selection dropdown */}
                        <div className="mb-4">
                            <label htmlFor="model-select" className="text-gray-300 mr-2">Model:</label>
                            <select
                                id="model-select"
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value as keyof typeof models)}
                                className="bg-gray-700 text-gray-200 rounded px-2 py-1"
                            >
                                {Object.keys(models).map((model: string) => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                        {/* Dynamic Notebook selection and management */}
                        <div className="mb-4 flex items-center gap-2">
                            <label htmlFor="notebook-select" className="text-gray-300 mr-2">Notebook:</label>
                            <select
                                id="notebook-select"
                                value={selectedNotebook}
                                onChange={e => setNotebookIndex(Number(e.target.value))}
                                className="bg-gray-700 text-gray-200 rounded px-2 py-1"
                            >
                                {notebooks.map((_, idx) => (
                                    <option key={idx} value={idx}>{`Notebook ${idx + 1}`}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => addNotebook()}
                                className="ml-2 px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600"
                                title="Add Notebook"
                            >
                                +
                            </button>
                            <button
                                onClick={() => removeNotebook(selectedNotebook)}
                                className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600"
                                title="Remove Notebook"
                                disabled={notebooks.length <= 1}
                            >
                                –
                            </button>
                        </div>
                        {
                            cells.map(cell => (
                                <MarkdownCell
                                    key={cell.id}
                                    cell={cell}
                                    isEditing={editingCellId === cell.id}
                                    isHighlighted={highlightedCellId === cell.id}
                                    onStartEditing={startEditingCell}
                                    onStopEditing={stopEditingCell}
                                    onDelete={deleteCell}
                                    onUpdateCellId={handleUpdateCellId}
                                />
                            ))
                        }
                        <button
                            onClick={addCell}
                            className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Cell
                        </button>
                    </div >
                </main >
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
                    />
                </aside>
            </div >
        </>
    );
}
