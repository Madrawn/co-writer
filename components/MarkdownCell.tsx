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
  const [splitView, setSplitView] = useState(false);

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
    // Stateful syntax highlighter for code blocks in diff
    const makeHighlightSyntax = () => {
      let lang: string | null = null;
      let inside = false;
      return (line: string) => {
        // Detect code block start: ```lang
        const codeBlockStart = line.match(/^```([a-zA-Z0-9]*)/);
        if (codeBlockStart) {
          lang = codeBlockStart[1] || "";
          inside = true;
          // Render the code block marker as plain text
          return <span style={{ opacity: 0.5 }}>{line}</span>;
        }
        // Detect code block end: ```
        if (inside && line.trim() === "```") {
          lang = null;
          inside = false;
          return <span style={{ opacity: 0.5 }}>{line}</span>;
        }
        // If inside a code block, highlight with the detected language
        if (inside && lang) {
          return (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={lang}
              customStyle={{ display: "inline", background: "none", padding: 0 }}
              PreTag="span"
            >
              {line}
            </SyntaxHighlighter>
          );
        }
        // Otherwise, render as plain text
        return <span>{line}</span>;
      };
    };
    const highlightSyntax = makeHighlightSyntax();
    return (
      <div
        data-testid={cell.id}
        className={`${baseClasses} ${highlightClasses}`}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setSplitView((v) => !v)}
            className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
            title={splitView ? "Show Inline Diff" : "Show Side-by-Side Diff"}
          >
            {splitView ? "Side-by-Side" : "Inline"}
          </button>
        </div>
        <ReactDiffViewer
          oldValue={cell.content}
          newValue={proposedChange}
          splitView={splitView}
          renderContent={highlightSyntax}
          useDarkTheme={true}
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
