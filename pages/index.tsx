import React from 'react';
import MarkdownCell from '../components/MarkdownCell';
import ChatPanel from '../components/ChatPanel';
import { PlusIcon } from '../components/icons';
import { useCoWriter } from '../hooks/useCoWriter';
import { models } from '../lib/azureService';

const IndexPage: React.FC = () => {
    // Import models from azureService
    // @ts-ignore
    // eslint-disable-next-line
    const [selectedModel, setSelectedModel] = React.useState(Object.keys(models)[0] as keyof typeof models);
    const [selectedSlot, setSelectedSlot] = React.useState(0);
    const [ttsEnabled, setTtsEnabled] = React.useState(true);
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
        handleUpdateCellId,
        isTtsSpeaking,
    } = useCoWriter(selectedModel, selectedSlot, ttsEnabled);

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
                        {/* Slot selection dropdown */}
                        <div className="mb-4">
                            <label htmlFor="slot-select" className="text-gray-300 mr-2">Slot:</label>
                            <select
                                id="slot-select"
                                value={selectedSlot}
                                onChange={e => setSelectedSlot(Number(e.target.value))}
                                className="bg-gray-700 text-gray-200 rounded px-2 py-1"
                            >
                                {[0, 1, 2, 3, 4].map(slot => (
                                    <option key={slot} value={slot}>{`Slot ${slot + 1}`}</option>
                                ))}
                            </select>
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
};

export default IndexPage;
