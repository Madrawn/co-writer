import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChangePreview from "./ChangePreview";
import type { ProposedChange } from "../types";

const baseChange: ProposedChange = {
  targetCellId: "cell-1",
  newContent: "Updated content",
};

const newCellChange: ProposedChange = {
  targetCellId: "new",
  newContent: "New cell content",
};

describe("ChangePreview", () => {
  const defaultProps = {
    messageId: "msg-1",
    changes: [baseChange, newCellChange],
    reviewDecision: undefined,
    onApply: vi.fn(),
    onReject: vi.fn(),
    cleanContent: "Clean content",
    onHighlightCell: vi.fn(),
  };

  it("renders cleanContent and suggested changes", () => {
    render(<ChangePreview {...defaultProps} />);
    expect(screen.getByText("Clean content")).toBeInTheDocument();
    expect(screen.getByText("Gemini suggests the following changes:")).toBeInTheDocument();
    expect(screen.getByText("Update Cell: cell")).toBeInTheDocument();
    expect(screen.getByText("Add New Cell")).toBeInTheDocument();
    expect(screen.getByText("Updated content")).toBeInTheDocument();
    expect(screen.getByText("New cell content")).toBeInTheDocument();
  });

  it("calls onApply and onReject with messageId", () => {
    render(<ChangePreview {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Apply changes"));
    expect(defaultProps.onApply).toHaveBeenCalledWith("msg-1");
    fireEvent.click(screen.getByLabelText("Reject changes"));
    expect(defaultProps.onReject).toHaveBeenCalledWith("msg-1");
  });

  it("shows applied and rejected states", () => {
    const { rerender } = render(<ChangePreview {...defaultProps} reviewDecision="applied" />);
    expect(screen.getByText("Applied")).toBeInTheDocument();
    rerender(<ChangePreview {...defaultProps} reviewDecision="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("calls onHighlightCell on mouse enter/leave for update cell", () => {
    render(<ChangePreview {...defaultProps} />);
    const updateCell = screen.getByText("Update Cell: cell").closest("div");
    fireEvent.mouseEnter(updateCell!);
    expect(defaultProps.onHighlightCell).toHaveBeenCalledWith("cell-1");
    fireEvent.mouseLeave(updateCell!);
    expect(defaultProps.onHighlightCell).toHaveBeenCalledWith(null);
  });

  it("calls onHighlightCell with null for new cell", () => {
    render(<ChangePreview {...defaultProps} />);
    const newCell = screen.getByText("Add New Cell").closest("div");
    fireEvent.mouseEnter(newCell!);
    expect(defaultProps.onHighlightCell).toHaveBeenCalledWith(null);
  });
});
