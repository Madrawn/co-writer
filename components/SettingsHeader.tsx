"use client";
import NotebookSelector from "../components/NotebookSelector";
import { models } from "../lib/azureService";
import React from "react";

// Types for SettingsHeader props
interface SettingsHeaderProps {
    selectedModel: keyof typeof models;
    setSelectedModel: React.Dispatch<React.SetStateAction<keyof typeof models>>;
    notebooks: any[]; // Replace 'any' with the actual notebook type if available
    addNotebook: () => void;
    removeNotebook: (index: number) => void;
    setNotebookIndex: (index: number) => void;
    selectedNotebook: number;
}
export function SettingsHeader(props: SettingsHeaderProps) {
    return (
        <div>
            <div className="mb-4">
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
