
import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarkdownCellData } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface MarkdownCellProps {
  cell: MarkdownCellData;
  isEditing: boolean;
  isHighlighted: boolean;
  onStartEditing: (id: string) => void;
  onStopEditing: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
}

const MarkdownCell: React.FC<MarkdownCellProps> = ({
  cell,
  isEditing,
  isHighlighted,
  onStartEditing,
  onStopEditing,
  onDelete,
}) => {
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
        <div className="absolute bottom-1 right-2 text-xs text-gray-600 pointer-events-none">
            Id: {cell.id.split('-')[0]}
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
            Id: {cell.id.split('-')[0]}
        </div>
    </div>
  );
};

export default MarkdownCell;
