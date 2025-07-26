"use client"
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { TrashIcon, PencilIcon } from './icons';
import { MarkdownCellData } from '@/types';

export interface MarkdownCellProps {
  cell: MarkdownCellData;
  isEditing: boolean;
  isHighlighted: boolean;
  onStartEditing: (id: string) => void;
  onStopEditing: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
  onUpdateCellId: (oldId: string, newId: string) => void;
}
const MarkdownCell: React.FC<MarkdownCellProps> = ({
  cell,
  isEditing,
  isHighlighted,
  onStartEditing,
  onStopEditing,
  onDelete,
  onUpdateCellId,
}) => {
  const [editingId, setEditingId] = useState(false);
  const [idInput, setIdInput] = useState(cell.id);
  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      // Move cursor to the end of the content
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editRef.current);
        range.collapse(false); // collapse to the end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div data-cell-id={cell.id} className="bg-gray-800 border-2 border-blue-500 rounded-lg p-4 pt-10 relative group">
        <div
          ref={editRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning={true}
          onBlur={(e) => onStopEditing(cell.id, e.currentTarget.innerText)}
          role="textbox"
          aria-multiline="true"
          className="w-full min-h-[5rem] bg-transparent text-gray-200 focus:outline-none whitespace-pre-wrap"
        >
          {cell.content}
        </div>

        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onDelete(cell.id);
            }}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            aria-label="Delete cell"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
        <div onClick={e => e.stopPropagation()}
          className="absolute bottom-1 right-2 text-xs text-gray-600">
          {editingId ? (
            <input
              type="text"
              value={idInput}
              autoFocus
              onClick={e => e.stopPropagation()}
              onChange={e => setIdInput(e.target.value)}
              onBlur={() => {
                setEditingId(false);
                if (idInput !== cell.id && idInput.trim()) {
                  onUpdateCellId(cell.id, idInput.trim());
                } else {
                  setIdInput(cell.id);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setEditingId(false);
                  if (idInput !== cell.id && idInput.trim()) {
                    onUpdateCellId(cell.id, idInput.trim());
                  } else {
                    setIdInput(cell.id);
                  }
                } else if (e.key === 'Escape') {
                  setEditingId(false);
                  setIdInput(cell.id);
                }
              }}
              className="bg-gray-900 text-gray-200 border border-gray-700 rounded px-1 py-0.5 text-xs w-28"
              placeholder="Enter cell ID"
              title="Edit cell ID"
            />
          ) : (
            <span
              style={{ cursor: 'pointer' }}
              onClick={e => e.stopPropagation()}
              onDoubleClick={e => {
                e.stopPropagation();
                setEditingId(true);
              }}
              title="Double-click to edit cell ID"
              className="pointer-events-auto"
            >
              Id: {cell.id.split('-')[0]}
            </span>
          )}
        </div>
      </div>
    );
  }

  const baseClasses = "rounded-lg p-4 min-h-[5rem] cursor-pointer transition-all duration-300 relative group";
  const highlightClasses = isHighlighted
    ? 'border-2 border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-500/10'
    : 'bg-gray-800/70 border border-gray-700 hover:border-blue-500';

  return (
    <div
      data-cell-id={cell.id}
      onClick={() => onStartEditing(cell.id)}
      className={`${baseClasses} ${highlightClasses}`}
    >
      <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-gray-100 prose-strong:text-gray-200 prose-code:text-pink-400 prose-pre:bg-gray-900/50 pb-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {cell.content || "Click to edit..."}
        </ReactMarkdown>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
        <PencilIcon className="w-5 h-5 text-gray-500" />
      </div>
      <div className="absolute bottom-1 right-2 text-xs text-gray-600 group-hover:text-gray-500 transition-colors">
        {editingId ? (
          <input
            type="text"
            value={idInput}
            autoFocus
            onChange={e => setIdInput(e.target.value)}
            onBlur={() => {
              setEditingId(false);
              if (idInput !== cell.id && idInput.trim()) {
                onUpdateCellId(cell.id, idInput.trim());
              } else {
                setIdInput(cell.id);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setEditingId(false);
                if (idInput !== cell.id && idInput.trim()) {
                  onUpdateCellId(cell.id, idInput.trim());
                } else {
                  setIdInput(cell.id);
                }
              } else if (e.key === 'Escape') {
                setEditingId(false);
                setIdInput(cell.id);
              }
            }}
            className="bg-gray-900 text-gray-200 border border-gray-700 rounded px-1 py-0.5 text-xs w-28"
            placeholder="Enter cell ID"
            title="Edit cell ID"
          />
        ) : (
          <span
            style={{ cursor: 'pointer' }}
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => {
              e.stopPropagation();
              setEditingId(true);
            }}
            title="Double-click to edit cell ID"
            className="pointer-events-auto"
          >
            Id: {cell.id.split('-')[0]}
          </span>
        )}
      </div>
    </div>
  );
};

export default MarkdownCell;
