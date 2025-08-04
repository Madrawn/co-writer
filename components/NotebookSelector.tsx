"use client";
import React, { memo } from "react";

interface NotebookSelectorProps {
    notebooks: any[]; // Replace 'any' with a more specific type if available
    addNotebook: () => void;
    removeNotebook: (index: number) => void;
    setNotebookIndex: (index: number) => void;
    selectedNotebook: number;
}

const NotebookSelector: React.FC<NotebookSelectorProps> = (props) => {
    return (
        <div className="mb-4 flex items-center gap-2">
            <label htmlFor="notebook-select" className="text-gray-300 mr-2">
                Notebook:
            </label>
            <select
                id="notebook-select"
                value={props.selectedNotebook}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.setNotebookIndex(Number(e.target.value))}
                className="bg-gray-700 text-gray-200 rounded px-2 py-1"
            >
                {props.notebooks.map((_: any, idx: number) => (
                    <option key={idx} value={idx}>{`Notebook ${idx + 1}`}</option>
                ))}
            </select>
            <button
                onClick={() => props.addNotebook()}
                className="ml-2 px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600"
                title="Add Notebook"
            >
                +
            </button>
            <button
                onClick={() => props.removeNotebook(props.selectedNotebook)}
                className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600"
                title="Remove Notebook"
                disabled={props.notebooks.length <= 1}
            >
                –
            </button>
        </div>
    );
}

export default memo(NotebookSelector);
