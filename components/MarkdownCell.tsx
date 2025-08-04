"use client";
import React, { useRef, useEffect, useState, memo, useMemo } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import mermaid from "mermaid";
import MermaidDiagram from "./MermaidDiagram";
import "./MarkdownCell.css";

import { TrashIcon, PencilIcon } from "./icons";
import type { MarkdownCellData } from "@/types";
import CellIdLabel from "./CellIdLabel";
import MakeHighlightSyntax from "./HighlightSyntax";
import PanzoomComponent from "./PanzoomComponent";

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
const defaultRendererSettings: {
  defaultRenderer: "dagre-d3" | "dagre-wrapper" | "elk";
} = { defaultRenderer: "elk" };
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  flowchart: defaultRendererSettings,
  state: defaultRendererSettings,
  class: defaultRendererSettings,
});

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
  const baseClasses =
    "prose prose-slate prose-invert max-w-none rounded-lg lg:p-4 min-h-[5rem] cursor-pointer transition-all duration-300 relative group";
  const MemoizedDiffViewer = memo(ReactDiffViewer);
  const MemoizedMarkdown = memo(ReactMarkdown);
  // Memoize plugins array to prevent reference changes
  const plugins = useMemo(() => [remarkGfm], []);
  const rawPlugins = useMemo(() => [rehypeRaw], []);
  // State for rendered Mermaid SVGs by code content
  const [mermaidSvgs, setMermaidSvgs] = useState<Record<string, string>>({});
  // Render Mermaid code blocks to SVG and store in state
  const renderMermaidToSvg = async (code: string) => {
    if (mermaidSvgs[code]) return; // Already rendered
    try {
      const { svg } = await mermaid.render(
        `mermaid-${Math.random().toString(36).slice(2)}`,
        code
      );
      setMermaidSvgs((prev) => ({ ...prev, [code]: svg }));
    } catch (e) {
      setMermaidSvgs((prev) => ({
        ...prev,
        [code]: `<pre style='color:red'>Mermaid render error</pre>`,
      }));
    }
  };

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

  // No longer need to run Mermaid globally; handled per code block

  if (isEditing) {
    return (
      <div
        data-testid={cell.id}
        className="bg-gray-800 border-2 border-blue-500 rounded-lg lg:p-4 pt-10 relative group"
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
    const highlightClasses = isHighlighted
      ? "border-2 border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-500/10"
      : "bg-gray-800/70 border border-gray-700 hover:border-blue-500";
    // Stateful syntax highlighter for code blocks in diff

    const highlightSyntax = MakeHighlightSyntax();
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
        <div className="not-prose">
          <MemoizedDiffViewer
            oldValue={cell.content}
            newValue={proposedChange}
            splitView={splitView}
            renderContent={highlightSyntax}
            useDarkTheme={true}
            compareMethod={DiffMethod.WORDS}
            // styles={{
            //   content: "not-prose",
            //   diffContainer: "not-prose",
            // }}
          />
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
        ></CellIdLabel>
      </div>
    );
  }

  const highlightClasses = isHighlighted
    ? "border-2 border-yellow-400 bg-gray-800 shadow-lg shadow-yellow-500/10"
    : "bg-gray-800/70 border border-gray-700 hover:border-blue-500";

  return (
    <div
      data-testid={cell.id}
      onDoubleClick={() => onStartEditing(cell.id)}
      className={`${baseClasses} ${highlightClasses}`}
    >
      <div className="max-w-none prose-p:text-gray-300 prose-headings:text-gray-100 prose-strong:text-gray-200 prose-code:text-pink-400 prose-pre:bg-gray-900/50 pb-4">
        <MemoizedMarkdown
          remarkPlugins={plugins}
          rehypePlugins={rawPlugins}
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
                const code = String(children).replace(/\n$/, "");
                useEffect(() => {
                  renderMermaidToSvg(code);
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [code]);
                if (mermaidSvgs[code]) {
                  return (
                    <PanzoomComponent>
                      <MermaidDiagram svg={mermaidSvgs[code]} />
                    </PanzoomComponent>
                  );
                }
                // Show loading or fallback
                return (
                  <div className="mermaid-loading">Rendering diagram...</div>
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
        </MemoizedMarkdown>
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

export default memo(MarkdownCell);
