import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import MarkdownCell, { MarkdownCellProps } from "./MarkdownCell";

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

describe("MarkdownCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders markdown content in non-editing mode", () => {
    render(<MarkdownCell {...defaultProps} />);
    expect(screen.getByText("Hello Markdown!")).toBeInTheDocument();
    // Pencil icon should be present
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
  });

  it("calls onStartEditing when clicked in non-editing mode", () => {
    render(<MarkdownCell {...defaultProps} />);
    fireEvent.click(screen.getByTestId("cell-123") || screen.getByText("Hello Markdown!").closest("div"));
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
    expect(defaultProps.onStopEditing).toHaveBeenCalledWith("cell-123", expect.stringContaining("Changed"));
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
    expect(defaultProps.onUpdateCellId).toHaveBeenCalledWith("cell-123", "new-id");
  });

  it("shows highlight styles when isHighlighted is true", () => {
    const { container } = render(<MarkdownCell {...defaultProps} isHighlighted={true} />);
    expect(container.firstChild).toHaveClass("border-yellow-400");
  });
});
