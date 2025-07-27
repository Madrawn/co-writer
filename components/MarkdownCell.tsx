"use client";
import React, { useRef, useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import mermaid from "mermaid";

import { TrashIcon, PencilIcon } from "./icons";
import type { MarkdownCellData } from "@/types";
import { CellIdLabel } from "./CellIdLabel";


export interface MarkdownCellProps {
  cell: MarkdownCellData;
  isEditing: boolean;
  isHighlighted: boolean;
  onStartEditing: (id: string) => void;
  onStopEditing: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
  onUpdateCellId: (oldId: string, newId: string) => void;
  proposedChange?: string; // New content proposed for this cell, if any
}

const MarkdownCell: React.FC<MarkdownCellProps> = ({
  cell,
  isEditing,
  isHighlighted,
  onStartEditing,
  onStopEditing,
  onDelete,
  onUpdateCellId,
  proposedChange,
}) => {
  const [editingId, setEditingId] = useState(false);
  const [idInput, setIdInput] = useState(cell.id);
  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  useEffect(() => {
    async function initializeMermaid() {
      if (!isEditing) {
        const defaultRendererSettings: {
          defaultRenderer: "dagre-d3" | "dagre-wrapper" | "elk";
        } = { defaultRenderer: "elk" };
        // mermaid.initialize({ startOnLoad: true });
        // mermaid.contentLoaded();
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          flowchart: defaultRendererSettings,
          state: defaultRendererSettings,
          class: defaultRendererSettings,
        });
        await mermaid.run({
          querySelector: ".mermaid",
        });
      }
    }
    initializeMermaid();
  }, [isEditing, cell.content]);

  if (isEditing) {
    return (
      <div
        data-testid={cell.id}
        className="bg-gray-800 border-2 border-blue-500 rounded-lg p-4 pt-10 relative group"
      >
        <div
          ref={editRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning={true}
          onBlur={(e) => onStopEditing(cell.id, e.currentTarget.innerText)}
          role="textbox"
          aria-multiline="true"
          title="Edit cell content"
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
        <CellIdLabel
          editingId={editingId}
          setEditingId={setEditingId}
          idInput={idInput}
          setIdInput={setIdInput}
          cell={cell}
          onUpdateCellId={onUpdateCellId}
        ></CellIdLabel>
      </div>
    );
  }

  // If a proposed change exists, show a diff viewer instead of the normal markdown
  if (proposedChange) {
    const baseClasses =
      "rounded-lg p-4 min-h-[5rem] cursor-pointer transition-all duration-300 relative group";
    const highlightClasses = isHighlighted
      ? "border-2 border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-500/10"
      : "bg-gray-800/70 border border-gray-700 hover:border-blue-500";
    // Syntax highlighting for code blocks in diff
    const highlightSyntax = (str: string) => (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language="markdown"
        PreTag="div"
        customStyle={{ display: "inline", background: "none", padding: 0 }}
      >
        {str}
      </SyntaxHighlighter>
    );
    return (
      <div
        data-testid={cell.id}
        className={`${baseClasses} ${highlightClasses}`}
      >
        <ReactDiffViewer
          oldValue={cell.content}
          newValue={proposedChange}
          splitView={true}
          renderContent={highlightSyntax}
          styles={{
            diffContainer: { background: "transparent" },
            line: { background: "none" },
            gutter: { background: "none" },
            contentText: { fontFamily: "inherit" },
          }}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
          <PencilIcon className="w-5 h-5 text-gray-500" />
        </div>
        <CellIdLabel
          editingId={editingId}
          setEditingId={setEditingId}
          idInput={idInput}
          setIdInput={setIdInput}
          cell={cell}
          onUpdateCellId={onUpdateCellId}
        ></CellIdLabel>
      </div>
    );
  }

  const baseClasses =
    "rounded-lg p-4 min-h-[5rem] cursor-pointer transition-all duration-300 relative group";
  const highlightClasses = isHighlighted
    ? "border-2 border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-500/10"
    : "bg-gray-800/70 border border-gray-700 hover:border-blue-500";

  return (
    <div
      data-testid={cell.id}
      onClick={() => onStartEditing(cell.id)}
      className={`${baseClasses} ${highlightClasses}`}
    >
      <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-gray-100 prose-strong:text-gray-200 prose-code:text-pink-400 prose-pre:bg-gray-900/50 pb-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: ({
              node,
              inline,
              className,
              children,
              ...props
            }: {
              node?: any;
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
              [key: string]: any;
            }) => {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              if (language === "mermaid") {
                return (
                  <div className="mermaid" {...props}>
                    {children}
                  </div>
                );
              }
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {cell.content || "Click to edit..."}
        </ReactMarkdown>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
        <PencilIcon className="w-5 h-5 text-gray-500" />
      </div>
      <CellIdLabel
        editingId={editingId}
        setEditingId={setEditingId}
        idInput={idInput}
        setIdInput={setIdInput}
        cell={cell}
        onUpdateCellId={onUpdateCellId}
      ></CellIdLabel>{" "}
    </div>
  );
};

export default MarkdownCell;
