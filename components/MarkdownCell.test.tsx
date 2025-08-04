import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import MarkdownCell, { MarkdownCellProps } from "./MarkdownCell";
import MakeHighlightSyntax from "./HighlightSyntax";
import { MarkdownCellData } from "@/types";

const baseCell = {
  id: "cell-123",
  content: "Hello **Markdown**!",
};

const defaultProps: MarkdownCellProps = {
  cell: baseCell,
  isEditing: false,
  isHighlighted: false,
  onStartEditing: vi.fn(),
  onStopEditing: vi.fn(),
  onDelete: vi.fn(),
  onUpdateCellId: vi.fn(),
};
describe("MarkdownCell diff viewer", () => {
  it("does not crash when toggling diff view with undefined lines", () => {
    const cell = { id: "cell1", content: "foo" };
    const proposedChange = "bar";
    const onStartEditing = vi.fn();
    const onStopEditing = vi.fn();
    const onDelete = vi.fn();
    const onUpdateCellId = vi.fn();

    // Render with a proposed change to show the diff viewer
    const { getByText } = render(
      <MarkdownCell
        cell={cell}
        isEditing={false}
        isHighlighted={false}
        onStartEditing={onStartEditing}
        onStopEditing={onStopEditing}
        onDelete={onDelete}
        onUpdateCellId={onUpdateCellId}
        proposedChange={proposedChange}
      />
    );

    // Click the diff view toggle button
    const toggleButton = getByText(/Side-by-Side|Inline/);
    fireEvent.click(toggleButton);

    // If no error is thrown, the test passes
    expect(true).toBe(true);
  });

  it("crashes when renderContent receives undefined", () => {
    // Render a MarkdownCell to get access to makeHighlightSyntax
    const cell = { id: "cell1", content: "foo" };
    const proposedChange = "bar";
    const onStartEditing = vi.fn();
    const onStopEditing = vi.fn();
    const onDelete = vi.fn();
    const onUpdateCellId = vi.fn();

    // Mount the component to get the renderContent function
    const { container } = render(
      <MarkdownCell
        cell={cell}
        isEditing={false}
        isHighlighted={false}
        onStartEditing={onStartEditing}
        onStopEditing={onStopEditing}
        onDelete={onDelete}
        onUpdateCellId={onUpdateCellId}
        proposedChange={proposedChange}
      />
    );

    // Find the ReactDiffViewer instance and call its renderContent with undefined
    // This requires a test util or you can extract makeHighlightSyntax for direct test
    // For now, let's simulate what the bug is:
    const highlightSyntax = MakeHighlightSyntax();
    expect(() => highlightSyntax(undefined)).toThrow();
  });

  it("crashes when toggling diff view with line count mismatch (repro bug)", () => {
    const cell = { id: "cell1", content: "line1\nline2\nline3" };
    const proposedChange = "line1\nline2";
    const onStartEditing = vi.fn();
    const onStopEditing = vi.fn();
    const onDelete = vi.fn();
    const onUpdateCellId = vi.fn();

    // Suppress error output for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      const { getByText } = render(
        <MarkdownCell
          cell={cell}
          isEditing={false}
          isHighlighted={false}
          onStartEditing={onStartEditing}
          onStopEditing={onStopEditing}
          onDelete={onDelete}
          onUpdateCellId={onUpdateCellId}
          proposedChange={proposedChange}
        />
      );
      // Click the diff view toggle button
      const toggleButton = getByText(/Side-by-Side|Inline/);
      fireEvent.click(toggleButton);
    }).toThrow(/match/);

    // Restore error output
    console.error = originalError;
  });
});
describe("MarkdownCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // it("renders markdown content in non-editing mode", () => {
  //   render(<MarkdownCell {...defaultProps} />);
  //   expect(screen.getByText("Hello Markdown!")).toBeInTheDocument();
  //   // Pencil icon should be present
  //   expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  // });

  it("calls onStartEditing when clicked in non-editing mode", () => {
    render(<MarkdownCell {...defaultProps} />);
    fireEvent.click(
      screen.getByTestId("cell-123") ||
        screen.getByText("Hello Markdown!").closest("div")
    );
    expect(defaultProps.onStartEditing).toHaveBeenCalledWith("cell-123");
  });

  it("renders editable content in editing mode", () => {
    render(<MarkdownCell {...defaultProps} isEditing={true} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Hello **Markdown**!")).toBeInTheDocument();
    // Trash icon should be present
    expect(screen.getByLabelText("Delete cell")).toBeInTheDocument();
  });

  it("calls onStopEditing with new content on blur", () => {
    render(<MarkdownCell {...defaultProps} isEditing={true} />);
    const textbox = screen.getByRole("textbox");
    fireEvent.input(textbox, { target: { innerText: "Changed content" } });
    fireEvent.blur(textbox);
    expect(defaultProps.onStopEditing).toHaveBeenCalledWith(
      "cell-123",
      expect.stringContaining("Changed")
    );
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<MarkdownCell {...defaultProps} isEditing={true} />);
    const deleteBtn = screen.getByLabelText("Delete cell");
    fireEvent.mouseDown(deleteBtn);
    expect(defaultProps.onDelete).toHaveBeenCalledWith("cell-123");
  });

  it("shows cell id and allows editing it", () => {
    render(<MarkdownCell {...defaultProps} isEditing={true} />);
    // Double click to edit cell id
    const idSpan = screen.getByText(/Id:/);
    fireEvent.doubleClick(idSpan);
    const input = screen.getByPlaceholderText("Enter cell ID");
    fireEvent.change(input, { target: { value: "new-id" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(defaultProps.onUpdateCellId).toHaveBeenCalledWith(
      "cell-123",
      "new-id"
    );
  });

  it("shows highlight styles when isHighlighted is true", () => {
    const { container } = render(
      <MarkdownCell {...defaultProps} isHighlighted={true} />
    );
    expect(container.firstChild).toHaveClass("border-yellow-400");
  });
});





describe("MarkdownCell Diff View Toggle", () => {
  const mockCell: MarkdownCellData = {
    id: "test-cell",
    content: "\n\n\nOriginal content\nwith multiple lines\n``` python\nprint('Hello World')\n```\n",
  };

  const mockProps = {
    cell: mockCell,
    isEditing: false,
    isHighlighted: false,
    onStartEditing: vi.fn(),
    onStopEditing: vi.fn(),
    onDelete: vi.fn(),
    onUpdateCellId: vi.fn(),
    proposedChange: "\n\nmodified content\nwith multiple lines\n``` js\nprint('Hello World')\n```\n",
  };

  it("should toggle between inline and side-by-side diff views", () => {
    render(<MarkdownCell {...mockProps} />);
    
    // Verify initial state (inline view)
    const toggleButton = screen.getByText("Inline");
    expect(toggleButton).toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(toggleButton);
    
    // Verify view changed to side-by-side
    expect(screen.getByText("Side-by-Side")).toBeInTheDocument();
    
    // Click again to toggle back
    fireEvent.click(toggleButton);
    
    // Verify back to inline view
    expect(screen.getByText("Inline")).toBeInTheDocument();
  });

  it("should render diff viewer with original and modified content", () => {
    render(<MarkdownCell {...mockProps} />);
    
    // Check for partial presence of content (works with word splitting)
    expect(screen.getByText(/Or.*i.*g.*i.*nal/)).toBeInTheDocument();
    expect(screen.getByText(/mod.*/)).toBeInTheDocument();
    expect(screen.getByText(/js/)).toBeInTheDocument();
    
    // Switch to side-by-side view
    fireEvent.click(screen.getByText("Inline"));
    
    // Verify side-by-side view renders content
    expect(screen.getByText(/Or.*i.*g.*i.*nal/)).toBeInTheDocument();
    expect(screen.getByText(/mod.*/)).toBeInTheDocument();
    expect(screen.getByText(/python/)).toBeInTheDocument();
  });
});