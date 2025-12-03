"use client";
import { MarkdownCellData } from "@/types";
import NotebookSelector from "../components/NotebookSelector";
import { models } from "../types";
import React from "react";

// Types for SettingsHeader props
interface SettingsHeaderProps {
    selectedModel: keyof typeof models;
    setSelectedModel: React.Dispatch<React.SetStateAction<keyof typeof models>>;
    notebooks: MarkdownCellData[][];
    addNotebook: () => void;
    removeNotebook: (index: number) => void;
    setNotebookIndex: (index: number) => void;
    selectedNotebook: number;
}
export function SettingsHeader(props: SettingsHeaderProps) {
    // Export handler: builds the payload and triggers download
    const handleExport = () => {
        // Get the current notebook's cells
        const cells = props.notebooks[props.selectedNotebook] || [];
        // Build the payload as sent to backend (mimic API contract)
        // For export, we just use the cells array as JSON
        const payload = {
            cells,
            selectedNotebook: props.selectedNotebook,
            modelName: props.selectedModel,
        };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notebook_${props.selectedNotebook}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (
        <div>
            <div className="mb-4 flex items-center gap-4">
                <label htmlFor="model-select" className="text-gray-300 mr-2">
                    Model:
                </label>
                <select
                    id="model-select"
                    value={props.selectedModel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.setSelectedModel(e.target.value as keyof typeof models)}
                    className="bg-gray-700 text-gray-200 rounded px-2 py-1"
                >
                    {Object.keys(models).map((model: string) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleExport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow"
                >
                    Export
                </button>
            </div>
            {/* Dynamic Notebook selection and management */}
            <NotebookSelector
                notebooks={props.notebooks}
                addNotebook={props.addNotebook}
                removeNotebook={props.removeNotebook}
                setNotebookIndex={props.setNotebookIndex}
                selectedNotebook={props.selectedNotebook}
            ></NotebookSelector>
        </div>
    );
}
