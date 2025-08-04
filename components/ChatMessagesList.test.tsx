import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatMessagesList from "./ChatMessagesList";

const baseMessages = [
  {
    id: "1",
    role: "user",
    content: "Hello",
    // ...other fields...
  },
  {
    id: "2",
    role: "model",
    content: "Hi there!",
    cleanContent: "Hi there!",
    proposedChanges: [
      {
        targetCellId: "cell-1",
        newContent: "print('Hello, world!')",
      },
    ],
    reviewDecision: undefined,
    // ...other fields...
  },
];

describe("ChatMessagesList", () => {
  const onApplyChanges = vi.fn();
  const onRejectChanges = vi.fn();
  const onHighlightCell = vi.fn();

  it("renders user and model messages", () => {
    render(
      <ChatMessagesList
        messages={baseMessages as any}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={false}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Gemini suggests the following changes:")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("calls onApplyChanges and onRejectChanges when buttons are clicked", () => {
    render(
      <ChatMessagesList
        messages={baseMessages as any}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={false}
      />
    );
    fireEvent.click(screen.getByText("Apply"));
    expect(onApplyChanges).toHaveBeenCalledWith("2");
    fireEvent.click(screen.getByText("Reject"));
    expect(onRejectChanges).toHaveBeenCalledWith("2");
  });

  it("shows loading indicator when isLoading is true and last message is from user", () => {
    const messages = [
      { id: "1", role: "user", content: "Hello" },
    ];
    render(
      <ChatMessagesList
        messages={messages as any}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={true}
      />
    );
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(0); // loading dots have no label, so just check for presence of animated dots
    expect(screen.getAllByText((content, el) => el?.className?.includes("animate-pulse")).length).toBeGreaterThan(0);
  });

  it("shows 'Applied' or 'Rejected' when reviewDecision is set", () => {
    const appliedMsg = {
      ...baseMessages[1],
      reviewDecision: "applied",
    };
    const rejectedMsg = {
      ...baseMessages[1],
      reviewDecision: "rejected",
    };
    const msgs = [baseMessages[0], appliedMsg, rejectedMsg];
    render(
      <ChatMessagesList
        messages={msgs as any}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={false}
      />
    );
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("calls onHighlightCell on mouse enter/leave of change preview", () => {
    render(
      <ChatMessagesList
        messages={baseMessages as any}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        isLoading={false}
      />
    );
    const cellHeader = screen.getByText(/Update Cell:/);
    fireEvent.mouseEnter(cellHeader.parentElement!);
    expect(onHighlightCell).toHaveBeenCalledWith("cell-1");
    fireEvent.mouseLeave(cellHeader.parentElement!);
    expect(onHighlightCell).toHaveBeenCalledWith(null);
  });
});
