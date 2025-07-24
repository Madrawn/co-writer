import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ProposedChange } from '../types';
import { CheckIcon, XMarkIcon } from './icons';

interface ChangePreviewProps {
  messageId: string;
  changes: ProposedChange[];
  reviewDecision?: 'applied' | 'rejected';
  onApply: (messageId: string) => void;
  onReject: (messageId: string) => void;
  cleanContent: string;
  onHighlightCell: (cellId: string | null) => void;
}

const ChangePreview: React.FC<ChangePreviewProps> = ({
  messageId,
  changes,
  reviewDecision,
  onApply,
  onReject,
  cleanContent,
  onHighlightCell,
}) => {
  return (
    <div className="bg-gray-700/50 border border-blue-500/30 rounded-lg overflow-hidden">
      <div className="p-4">
        {cleanContent && (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-p:text-white prose-code:text-pink-300 mb-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanContent}</ReactMarkdown>
            </div>
        )}
        <p className="text-sm font-semibold text-gray-300 mb-3">Gemini suggests the following changes:</p>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {changes.map((change, index) => (
            <div 
              key={index} 
              className="bg-gray-800/60 rounded-md p-3 border border-gray-600/80 hover:bg-gray-800/90 hover:border-blue-500/50 transition-all cursor-pointer"
              onMouseEnter={() => onHighlightCell(change.targetCellId !== 'new' ? change.targetCellId : null)}
              onMouseLeave={() => onHighlightCell(null)}
            >
              <h4 className="text-xs font-bold uppercase text-blue-400 mb-2">
                {change.targetCellId === 'new'
                  ? 'Add New Cell'
                  : `Update Cell: ${change.targetCellId.split('-')[0]}`}
              </h4>
              <div className="prose prose-invert prose-sm max-w-none bg-gray-900/50 rounded p-2 max-h-40 overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{change.newContent || " "}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-800/50 p-2 flex justify-end space-x-2">
        {!reviewDecision ? (
            <>
                <button
                onClick={() => onApply(messageId)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                aria-label="Apply changes"
                >
                <CheckIcon className="w-4 h-4" />
                <span>Apply</span>
                </button>
                <button
                onClick={() => onReject(messageId)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                aria-label="Reject changes"
                >
                <XMarkIcon className="w-4 h-4" />
                <span>Reject</span>
                </button>
            </>
        ) : reviewDecision === 'applied' ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 text-sm text-green-400" aria-label="Changes applied">
                <CheckIcon className="w-4 h-4" />
                <span>Applied</span>
            </div>
        ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-400" aria-label="Changes rejected">
                <XMarkIcon className="w-4 h-4" />
                <span>Rejected</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChangePreview;