import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "./MessageBubble";
import type { MessageRole } from "../types";

describe("MessageBubble", () => {
  const baseMsg = {
    id: "1",
    role: "model" as MessageRole,
    content: "Hello, **world**!",
    cleanContent: "",
  };

  it("renders assistant message with correct class", () => {
    render(<MessageBubble msg={baseMsg} />);
    // Use a function matcher to find the text split by elements
    const bubble = screen.getByText((_, node) => {
      const hasText = (node: Element) => node.textContent === "Hello, world!";
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(
        (node as Element)?.children || []
      ).every((child) => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    });
    expect(bubble).toBeInTheDocument();
    // parent div should have bg-gray-700 for assistant
    expect(bubble.closest(".bg-gray-700")).toBeTruthy();
  });

  it("renders user message with correct class", () => {
    render(
      <MessageBubble
        msg={{ ...baseMsg, role: "user" as MessageRole, content: "Hi there!" }}
      />
    );
    const bubble = screen.getByText("Hi there!");
    expect(bubble.closest(".bg-blue-600")).toBeTruthy();
  });

  it("renders markdown content", () => {
    render(<MessageBubble msg={baseMsg} />);
    // Markdown bold should be rendered as <strong>
    expect(
      screen.getByText("world", { selector: "strong" })
    ).toBeInTheDocument();
  });

  it("shows and hides thinking section when toggled", () => {
    const thinkingMsg = {
      ...baseMsg,
      thinking: "Model is thinking...",
    };
    render(<MessageBubble msg={thinkingMsg} />);
    const button = screen.getByRole("button", { name: /show model thinking/i });
    expect(button).toBeInTheDocument();
    // Initially, thinking section is not visible
    expect(screen.queryByText("Model is thinking...")).toBeNull();
    // Click to show
    fireEvent.click(button);
    expect(screen.getByText("Model is thinking...")).toBeInTheDocument();
    // Click to hide
    fireEvent.click(
      screen.getByRole("button", { name: /hide model thinking/i })
    );
    expect(screen.queryByText("Model is thinking...")).toBeNull();
  });

  it("renders cleanContent if provided", () => {
    render(
      <MessageBubble
        msg={{
          ...baseMsg,
          cleanContent: "Clean content here",
          content: "Ignored",
        }}
      />
    );
    expect(screen.getByText("Clean content here")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).toBeNull();
  });

  it("applies correct wrapper classes", () => {
    render(<MessageBubble msg={baseMsg} />);
    // Use a function matcher to find the text split by elements
    const bubble = screen.getByText((_, node) => {
      const hasText = (node: Element) => node.textContent === "Hello, world!";
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(
        (node as Element)?.children || []
      ).every((child) => !hasText(child));
      return nodeHasText && childrenDontHaveText;
    });
    const wrapper = bubble.closest("div.max-w-md");
    expect(wrapper).toHaveClass("rounded-xl");
    expect(wrapper).toHaveClass("px-4");
    expect(wrapper).toHaveClass("py-2");
  });
});
